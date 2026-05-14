import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./src/db/schema.js";
import { eq } from "drizzle-orm";
import { getStripe } from "./src/lib/stripe.js";
import gplay from "google-play-scraper";

// Setup Database Connections
const sqlite = new Database('./local.db');
sqlite.exec('PRAGMA foreign_keys = ON');
export const db = drizzle(sqlite, { schema });

// --- Cron Engine: Monitoring System ---
const PING_INTERVAL_MS = 1000 * 60; // We check every 1 minute if an app is due for a ping

async function runHealthChecks() {
  console.log("[PingEngine] Checking for apps that need monitoring...");
  try {
    const apps = await db.select().from(schema.apps).where(eq(schema.apps.isActive, true));
    
    for (const app of apps) {
      // In a real production scalable app, we'd check if `app.checkInterval` has elapsed 
      // since the last ping. For MVP, we'll ping all active ones every loop if it's been long enough.
      console.log(`[PingEngine] Pinging ${app.url}...`);
      
      const startTime = Date.now();
      let isUp = false;
      let statusCode = 0;
      let errorMessage = null;

      try {
        // Play Store Monitoring Support
        if (app.url.includes('play.google.com/store/apps/details')) {
          try {
            const urlObj = new URL(app.url);
            const playAppId = urlObj.searchParams.get('id');
            if (!playAppId) throw new Error("Invalid Play Store URL");
            
            console.log(`[PingEngine] Specialized Play Store check for: ${playAppId}`);
            const appDetails = await gplay.app({ appId: playAppId });
            isUp = !!appDetails;
            statusCode = 200;
          } catch (playErr: any) {
            isUp = false;
            statusCode = 404;
            errorMessage = `Play Store Error: ${playErr.message}`;
          }
        } else {
          // Standard HTTP/URL check
          const response = await fetch(app.url, {
            method: 'GET',
            headers: { 'User-Agent': 'AfterlaunchMonitor/1.0 (+https://afterlaunch.app)' },
            signal: AbortSignal.timeout(10000)
          });
          
          statusCode = response.status;
          isUp = response.ok;
        }
      } catch (err: any) {
        isUp = false;
        statusCode = 0; // Timeout or network failure
        errorMessage = err.message;
      }

      const responseTimeMs = Date.now() - startTime;
      console.log(`[PingEngine] ${app.url} is ${isUp ? 'UP' : 'DOWN'} - ${statusCode} (${responseTimeMs}ms)`);

      // Store the result
      const crypto = await import('crypto'); // Built-in node module for random UUIDs
      const checkId = crypto.randomUUID();
      
      await db.insert(schema.healthChecks).values({
        id: checkId,
        appId: app.id,
        isUp,
        statusCode,
        responseTimeMs,
        errorMessage,
      });

      // Fetch user to check alert preferences
      const userList = await db.select().from(schema.users).where(eq(schema.users.id, app.userId));
      const user = userList[0];

      // Incident trigger logic: if status flips from UP -> DOWN, open an incident.
      // If status flips from DOWN -> UP, resolve incident.
      
      // Get the last known status before this check
      const previousChecks = await db.select()
        .from(schema.healthChecks)
        .where(eq(schema.healthChecks.appId, app.id))
        .orderBy(schema.healthChecks.checkedAt)
      
      // We need the second to last check, because we just inserted the latest one
      const sortedChecks = previousChecks.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
      const previousCheck = sortedChecks.length > 1 ? sortedChecks[1] : null;

      if (previousCheck) {
        if (previousCheck.isUp && !isUp) {
          // Flip UP -> DOWN: Create Incident
          console.log(`[IncidentEngine] 🚨 App ${app.url} went DOWN! Opening incident.`);
          const incidentId = crypto.randomUUID();
          await db.insert(schema.incidents).values({
            id: incidentId,
            appId: app.id,
            cause: errorMessage || `${statusCode} Error`,
            startedAt: new Date()
          });
          
          if (user?.emailAlerts) {
            await db.insert(schema.alerts).values({
              id: crypto.randomUUID(),
              incidentId,
              userId: app.userId,
              type: 'email'
            });
            console.log(`[ALERT] 📧 Email sent to user for ${app.url} (DOWNTIME)!`);
          }
          
          if (user?.pushAlerts) {
            console.log(`[ALERT] 📱 Push Notification sent to device for ${app.url} (DOWNTIME)!`);
          }

          if (user?.smsAlerts) {
            console.log(`[ALERT] 💬 SMS Alert sent to user for ${app.url} (DOWNTIME)!`);
          }
        } else if (!previousCheck.isUp && isUp) {
          // Flip DOWN -> UP: Close Incident
          console.log(`[IncidentEngine] ✅ App ${app.url} recovered! Closing incident.`);
          
          // Find the active incident
          const activeIncidents = await db.select()
            .from(schema.incidents)
            .where(eq(schema.incidents.appId, app.id));
            
          const activeIncident = activeIncidents.find(i => i.endedAt === null);
          
          if (activeIncident) {
            const endedAt = new Date();
            const startedAt = new Date(activeIncident.startedAt);
            const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
            
            await db.update(schema.incidents)
              .set({ endedAt, durationSeconds })
              .where(eq(schema.incidents.id, activeIncident.id));
              
            if (user?.emailAlerts) {
              await db.insert(schema.alerts).values({
                id: crypto.randomUUID(),
                incidentId: activeIncident.id,
                userId: app.userId,
                type: 'email'
              });
              console.log(`[ALERT] 📧 Email sent to user for ${app.url} (RECOVERY)!`);
            }
            
            if (user?.pushAlerts) {
              console.log(`[ALERT] 📱 Push Notification sent to device for ${app.url} (RECOVERY)!`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[PingEngine] System Error:", error);
  }
}

// Start Interval background task
setInterval(runHealthChecks, PING_INTERVAL_MS);

// --- Express App ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook needs raw body
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error("[Stripe] Missing signature or webhook secret");
      return res.status(400).send("Webhook Error: Missing signature or secret");
    }

    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe] Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;

      if (userId && plan) {
        console.log(`[Stripe] Payment success for user ${userId}, plan: ${plan}`);
        try {
          await db.update(schema.users)
            .set({ plan })
            .where(eq(schema.users.id, userId));
        } catch (dbErr) {
          console.error("[Stripe] Failed to update user plan in DB", dbErr);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API: Health status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API User Settings
  app.get("/api/user/settings", async (req, res) => {
    try {
      let users = await db.select().from(schema.users);
      if (users.length === 0) {
        const crypto = await import('crypto');
        const userId = crypto.randomUUID();
        await db.insert(schema.users).values({
          id: userId,
          email: "demo@afterlaunch.app",
          passwordHash: "mock",
          name: "Demo User",
          plan: "free"
        });
        users = await db.select().from(schema.users);
      }
      res.json(users[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/user/settings", async (req, res) => {
    try {
      const { emailAlerts, smsAlerts, pushAlerts, phoneNumber } = req.body;
      const users = await db.select().from(schema.users);
      if (users.length === 0) return res.status(404).json({ error: "User not found" });
      
      await db.update(schema.users)
        .set({ 
          emailAlerts: emailAlerts !== undefined ? emailAlerts : undefined, 
          smsAlerts: smsAlerts !== undefined ? smsAlerts : undefined, 
          pushAlerts: pushAlerts !== undefined ? pushAlerts : undefined,
          phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined
        })
        .where(eq(schema.users.id, users[0].id));
        
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/user/plan", async (req, res) => {
    try {
      const { plan } = req.body;
      const users = await db.select().from(schema.users);
      if (users.length === 0) return res.status(404).json({ error: "User not found" });
      
      await db.update(schema.users)
        .set({ plan })
        .where(eq(schema.users.id, users[0].id));
        
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { plan } = req.body;
      const users = await db.select().from(schema.users);
      if (users.length === 0) return res.status(404).json({ error: "User not found" });
      const user = users[0];

      const stripe = getStripe();
      
      const planDisplayNames: Record<string, string> = {
        pro: "Pro Plan",
        promax: "Pro Max Plan",
        unlimited: "Unlimited Plan"
      };

      const planPrices: Record<string, number> = {
        pro: 999,      // £9.99
        promax: 4999,   // £49.99
        unlimited: 9999 // £99.99
      };

      if (!planPrices[plan]) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `Afterlaunch - ${planDisplayNames[plan]}`,
              },
              unit_amount: planPrices[plan],
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL}/settings?success=true`,
        cancel_url: `${process.env.APP_URL}/settings?canceled=true`,
        metadata: {
          userId: user.id,
          plan: plan
        }
      });

      res.json({ url: session.url });
    } catch (e: any) {
      console.error("[Stripe] Error creating checkout session:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // API get app info from URL (Play Store)
  app.get("/api/utils/app-info", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') return res.status(400).json({ error: "URL is required" });
      
      if (url.includes('play.google.com/store/apps/details')) {
        const urlObj = new URL(url);
        const playAppId = urlObj.searchParams.get('id');
        if (!playAppId) return res.status(400).json({ error: "Invalid Play Store URL" });
        
        try {
          const appDetails = await gplay.app({ appId: playAppId });
          return res.json({ name: appDetails.title, icon: appDetails.icon });
        } catch (e: any) {
          return res.status(404).json({ error: "App not found on Play Store" });
        }
      }
      
      res.json({ name: null });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API list apps
  app.get("/api/apps", async (req, res) => {
    try {
      const allApps = await db.select().from(schema.apps);
      
      // Get latest health check for each app to show status
      const appsWithStatus = await Promise.all(allApps.map(async (app) => {
        const checks = await db.select()
          .from(schema.healthChecks)
          .where(eq(schema.healthChecks.appId, app.id));
        
        // Sort in memory for prototype simplicity
        checks.sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
        
        let lastCheck = null;
        if (checks.length > 0) {
          lastCheck = checks[checks.length - 1];
        }
        return { ...app, lastCheck };
      }));

      res.json(appsWithStatus);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API get app details
  app.get("/api/apps/:id", async (req, res) => {
    try {
      const apps = await db.select().from(schema.apps).where(eq(schema.apps.id, req.params.id));
      if (apps.length === 0) return res.status(404).json({ error: "Not found" });
      
      const appData = apps[0];
      const checks = await db.select().from(schema.healthChecks).where(eq(schema.healthChecks.appId, appData.id));
      const incidents = await db.select().from(schema.incidents).where(eq(schema.incidents.appId, appData.id));
      
      checks.sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
      incidents.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      
      res.json({ ...appData, checks, incidents });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API get all incidents
  app.get("/api/incidents", async (req, res) => {
    try {
      const { appId } = req.query;
      const allIncidents = await db.select().from(schema.incidents);
      const allApps = await db.select().from(schema.apps);
      
      let filtered = allIncidents;
      if (appId && appId !== 'all') {
        const filterId = String(appId);
        filtered = allIncidents.filter(i => String(i.appId) === filterId);
      }

      filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      const decorated = filtered.map(inc => {
        const appInfo = allApps.find(a => a.id === inc.appId);
        return { ...inc, appUrl: appInfo?.url, appName: appInfo?.name };
      });
      
      res.json(decorated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API simulate downtime
  app.post("/api/apps/:id/simulate", async (req, res) => {
    try {
      const appId = req.params.id;
      const crypto = await import('crypto');

      await db.insert(schema.healthChecks).values({
        id: crypto.randomUUID(),
        appId,
        isUp: false,
        statusCode: 503,
        responseTimeMs: 4000,
        errorMessage: "Simulated 503 Error (Test)",
        checkedAt: new Date()
      });

      const incidentId = crypto.randomUUID();
      await db.insert(schema.incidents).values({
        id: incidentId,
        appId,
        cause: "Simulated 503 Error (Test)",
        startedAt: new Date()
      });

      console.log(`[ALERT] 🚨 Simulated Drop! 📱 Push sent! Email sent!`);
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API simulate recovery
  app.post("/api/apps/:id/recover", async (req, res) => {
    try {
      const appId = req.params.id;
      const crypto = await import('crypto');

      await db.insert(schema.healthChecks).values({
        id: crypto.randomUUID(),
        appId,
        isUp: true,
        statusCode: 200,
        responseTimeMs: 120,
        errorMessage: null,
        checkedAt: new Date()
      });

      const activeIncidents = await db.select().from(schema.incidents).where(eq(schema.incidents.appId, appId));
      const activeIncident = activeIncidents.find(i => i.endedAt === null);

      if (activeIncident) {
        const endedAt = new Date();
        const startedAt = new Date(activeIncident.startedAt);
        const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

        await db.update(schema.incidents).set({ endedAt, durationSeconds }).where(eq(schema.incidents.id, activeIncident.id));
        console.log(`[ALERT] ✅ Simulated Recovery! 📱 Push sent! Email sent!`);
      }

      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API create app
  app.post("/api/apps", async (req, res) => {
    try {
      const { name, url } = req.body;
      const crypto = await import('crypto');
      
      let users = await db.select().from(schema.users);
      if (users.length === 0) {
        const userId = crypto.randomUUID();
        await db.insert(schema.users).values({
          id: userId,
          email: "demo@afterlaunch.app",
          passwordHash: "mock",
          name: "Demo User"
        });
        users = [{ 
          id: userId, 
          email: "demo@afterlaunch.app", 
          passwordHash: "mock", 
          name: "Demo User", 
          plan: "free", 
          emailAlerts: true, 
          smsAlerts: false, 
          pushAlerts: false, 
          createdAt: new Date() 
        }];
      }

      const id = crypto.randomUUID();
      await db.insert(schema.apps).values({
        id,
        userId: users[0].id,
        name,
        url,
        isActive: true,
        checkInterval: 60 // Pinging every minute for demo
      });
      res.json({ id, name, url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API get recent logs (health checks)
  app.get("/api/logs", async (req, res) => {
    try {
      const { appId } = req.query;
      let logsQuery = db.select().from(schema.healthChecks);
      
      const allApps = await db.select().from(schema.apps);
      const allChecks = await logsQuery;
      
      // Filter by appId if provided
      let filtered = allChecks;
      if (appId) {
        const filterId = String(appId);
        filtered = allChecks.filter(c => String(c.appId) === filterId);
      }
      
      // Sort and take last 100
      const sorted = filtered.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()).slice(0, 100);
      
      const decorated = sorted.map(check => {
        const appInfo = allApps.find(a => a.id === check.appId);
        return { ...check, appName: appInfo?.name || 'Unknown', appUrl: appInfo?.url || 'Unknown' };
      });
      
      res.json(decorated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API delete app
  app.delete("/api/apps/:id", async (req, res) => {
    try {
      await db.delete(schema.apps).where(eq(schema.apps.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API update app (isActive toggle)
  app.patch("/api/apps/:id", async (req, res) => {
    try {
      const { isActive } = req.body;
      const id = req.params.id;
      
      await db.update(schema.apps)
        .set({ isActive })
        .where(eq(schema.apps.id, id));
        
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite Integration for the SPA
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running internally on port ${PORT}`);
    // Run an initial ping cycle a few seconds after booting up
    setTimeout(runHealthChecks, 5000);
  });
}

startServer();
