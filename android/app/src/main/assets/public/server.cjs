var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  db: () => db
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_better_sqlite32 = require("drizzle-orm/better-sqlite3");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  alerts: () => alerts,
  apps: () => apps,
  healthChecks: () => healthChecks,
  incidents: () => incidents,
  users: () => users
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var import_drizzle_orm = require("drizzle-orm");
var users = (0, import_sqlite_core.sqliteTable)("users", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  email: (0, import_sqlite_core.text)("email").notNull().unique(),
  passwordHash: (0, import_sqlite_core.text)("password_hash").notNull(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  plan: (0, import_sqlite_core.text)("plan").notNull().default("free"),
  // 'free' or 'autonomy'
  createdAt: (0, import_sqlite_core.integer)("created_at", { mode: "timestamp" }).notNull().default(import_drizzle_orm.sql`(unixepoch())`)
});
var apps = (0, import_sqlite_core.sqliteTable)("apps", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("user_id").notNull().references(() => users.id),
  name: (0, import_sqlite_core.text)("name").notNull(),
  url: (0, import_sqlite_core.text)("url").notNull(),
  checkInterval: (0, import_sqlite_core.integer)("check_interval").notNull().default(300),
  // Default 5 minutes
  isActive: (0, import_sqlite_core.integer)("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: (0, import_sqlite_core.integer)("created_at", { mode: "timestamp" }).notNull().default(import_drizzle_orm.sql`(unixepoch())`)
});
var healthChecks = (0, import_sqlite_core.sqliteTable)("health_checks", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  appId: (0, import_sqlite_core.text)("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  statusCode: (0, import_sqlite_core.integer)("status_code").notNull(),
  responseTimeMs: (0, import_sqlite_core.integer)("response_time_ms").notNull(),
  isUp: (0, import_sqlite_core.integer)("is_up", { mode: "boolean" }).notNull(),
  sslExpiryDays: (0, import_sqlite_core.integer)("ssl_expiry_days"),
  errorMessage: (0, import_sqlite_core.text)("error_message"),
  checkedAt: (0, import_sqlite_core.integer)("checked_at", { mode: "timestamp" }).notNull().default(import_drizzle_orm.sql`(unixepoch())`)
});
var incidents = (0, import_sqlite_core.sqliteTable)("incidents", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  appId: (0, import_sqlite_core.text)("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  startedAt: (0, import_sqlite_core.integer)("started_at", { mode: "timestamp" }).notNull().default(import_drizzle_orm.sql`(unixepoch())`),
  endedAt: (0, import_sqlite_core.integer)("ended_at", { mode: "timestamp" }),
  durationSeconds: (0, import_sqlite_core.integer)("duration_seconds"),
  cause: (0, import_sqlite_core.text)("cause")
  // e.g., 'timeout', '5xx', 'dns'
});
var alerts = (0, import_sqlite_core.sqliteTable)("alerts", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  incidentId: (0, import_sqlite_core.text)("incident_id").notNull().references(() => incidents.id),
  userId: (0, import_sqlite_core.text)("user_id").notNull().references(() => users.id),
  type: (0, import_sqlite_core.text)("type").notNull(),
  // 'email', 'sms'
  sentAt: (0, import_sqlite_core.integer)("sent_at", { mode: "timestamp" }).notNull().default(import_drizzle_orm.sql`(unixepoch())`),
  delivered: (0, import_sqlite_core.integer)("delivered", { mode: "boolean" }).notNull().default(false)
});

// server.ts
var import_drizzle_orm2 = require("drizzle-orm");
var sqlite = new import_better_sqlite3.default("./local.db");
var db = (0, import_better_sqlite32.drizzle)(sqlite, { schema: schema_exports });
var PING_INTERVAL_MS = 1e3 * 60;
async function runHealthChecks() {
  console.log("[PingEngine] Checking for apps that need monitoring...");
  try {
    const apps2 = await db.select().from(apps).where((0, import_drizzle_orm2.eq)(apps.isActive, true));
    for (const app of apps2) {
      console.log(`[PingEngine] Pinging ${app.url}...`);
      const startTime = Date.now();
      let isUp = false;
      let statusCode = 0;
      let errorMessage = null;
      try {
        const response = await fetch(app.url, {
          method: "GET",
          // Important: Send a user-agent to prevent blocks from basic WAFs
          headers: { "User-Agent": "AfterlaunchMonitor/1.0 (+https://afterlaunch.app)" },
          // AbortController for timeouts (e.g. 10s)
          signal: AbortSignal.timeout(1e4)
        });
        statusCode = response.status;
        isUp = response.ok;
      } catch (err) {
        isUp = false;
        statusCode = 0;
        errorMessage = err.message;
      }
      const responseTimeMs = Date.now() - startTime;
      console.log(`[PingEngine] ${app.url} is ${isUp ? "UP" : "DOWN"} - ${statusCode} (${responseTimeMs}ms)`);
      const crypto = await import("crypto");
      const checkId = crypto.randomUUID();
      await db.insert(healthChecks).values({
        id: checkId,
        appId: app.id,
        isUp,
        statusCode,
        responseTimeMs,
        errorMessage
      });
    }
  } catch (error) {
    console.error("[PingEngine] System Error:", error);
  }
}
setInterval(runHealthChecks, PING_INTERVAL_MS);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/apps", async (req, res) => {
    try {
      const allApps = await db.select().from(apps);
      res.json(allApps);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running internally on port ${PORT}`);
    setTimeout(runHealthChecks, 5e3);
  });
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  db
});
//# sourceMappingURL=server.cjs.map
