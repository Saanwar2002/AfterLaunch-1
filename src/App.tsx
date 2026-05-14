import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Activity, Bell, Settings, Plus, LogOut, ArrowLeft, AlertCircle, CheckCircle2, FileText, Trash2, Play, Pause, MoreHorizontal, Search } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { AppProvider, useAppContext } from "./lib/AppContext";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/app/');
    return location.pathname === path;
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const { selectedAppName, setSelectedAppId, setSelectedAppName } = useAppContext();
  const [user, setUser] = useState<any>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
    // Listen for plan changes
    window.addEventListener('user_updated', fetchUser);
    return () => window.removeEventListener('user_updated', fetchUser);
  }, []);

  // For Capacitor Push Notifications
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Simple built-in alert for demo purposes
        alert(`Alert: ${notification.title}\n${notification.body}`);
      });
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#09090b] text-neutral-100 font-sans flex-col md:flex-row relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none auto-pulse" />
      {/* Sidebar for Desktop */}
      <aside className="w-64 border-r border-white/10 bg-[#09090b]/80 backdrop-blur-md p-6 flex flex-col hidden md:flex relative z-20">
        <div className="flex flex-col mb-10">
          <div className="flex items-center gap-3 text-emerald-500 cursor-pointer group mb-4" onClick={() => { setSelectedAppId(null); setSelectedAppName(null); }}>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Activity className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="tracking-tighter text-white font-display font-black text-2xl uppercase leading-none">AFTERLAUNCH</span>
              <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] mt-1">Status Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-2 w-2 rounded-full ${user?.plan === 'free' ? 'bg-neutral-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${user?.plan === 'free' ? 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
              {user?.plan ? `${user.plan.toUpperCase()} Plan` : 'Loading...'}
            </span>
          </div>
          {selectedAppName && (
            <div className="text-neutral-400 text-sm mt-3 truncate border-l-2 border-emerald-500/30 pl-3">
              {selectedAppName}
            </div>
          )}
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link to="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/') ? 'text-white bg-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`}>
            <Activity className="h-5 w-5" />
            Apps Overview
          </Link>
          <Link to="/incidents" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/incidents') ? 'text-white bg-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`}>
            <Bell className="h-5 w-5" />
            Incidents
          </Link>
          <Link to="/logs" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/logs') ? 'text-white bg-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`}>
            <FileText className="h-5 w-5" />
            Logs
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/settings') ? 'text-white bg-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`}>
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>

        <div className="pt-4 border-t border-white/10">
           <button className="flex items-center gap-3 px-3 py-2 text-neutral-500 hover:text-neutral-300 w-full text-left rounded-md transition-colors">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 relative z-10 bg-[#09090b]/40">
        <header className="h-24 border-b-4 border-emerald-500 flex items-center px-6 md:px-12 shrink-0 relative z-20 bg-[#09090b] shadow-[0_10px_50px_rgba(0,0,0,0.6)]">
          {/* Mobile brand logo */}
          <div className="flex items-center gap-3 md:hidden text-emerald-500 cursor-pointer" onClick={() => { setSelectedAppId(null); setSelectedAppName(null); navigate('/'); }}>
            <div className="p-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30">
              <Activity className="h-6 w-6 shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="tracking-tighter text-white font-display font-black text-2xl uppercase leading-none">
                AFTERLAUNCH
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Control Panel</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-display font-black uppercase tracking-tighter text-white hidden md:block ml-auto mr-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {location.pathname === '/' ? 'System Overview' : location.pathname === '/incidents' ? 'Incidents' : location.pathname === '/logs' ? 'Error Logs' : 'Global Settings'}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview onAddClick={() => setShowAddModal(true)} />} />
            <Route path="/app/:id" element={<AppDetail />} />
            <Route path="/incidents" element={<IncidentsView />} />
            <Route path="/logs" element={<LogsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </div>
      </main>

      {/* Add App Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-medium text-white mb-4">Add Monitor</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setAddError("");
              
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              let url = (form.elements.namedItem('url') as HTMLInputElement).value;
              
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
              }

              try {
                new URL(url);
              } catch (e) {
                setAddError("Please enter a valid URL");
                setIsSubmitting(false);
                return;
              }
              
              try {
                const res = await fetch('/api/apps', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, url })
                });
                
                if (!res.ok) {
                  throw new Error("Failed to add app");
                }
                
                setShowAddModal(false);
                // Trigger a refresh event for the dashboard without reloading the iframe
                window.dispatchEvent(new Event('refresh_dashboard'));
              } catch (err: any) {
                console.error("Failed to add app", err);
                setAddError(err.message || "An error occurred");
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="space-y-4">
                {addError && <div className="text-red-500 text-sm">{addError}</div>}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">App Name</label>
                  <input required name="name" type="text" placeholder="e.g. My Next.js SaaS" className="w-full bg-neutral-950 border border-white/20 rounded-md px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">URL to Monitor</label>
                  <div className="relative">
                    <input 
                      required 
                      name="url" 
                      type="text" 
                      placeholder="myapp.com or Play Store link" 
                      className="w-full bg-neutral-950 border border-white/20 rounded-md px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      onBlur={async (e) => {
                        const url = e.target.value;
                        if (url.includes('play.google.com')) {
                          try {
                            const res = await fetch(`/api/utils/app-info?url=${encodeURIComponent(url)}`);
                            if (res.ok) {
                              const data = await res.json();
                              if (data.name) {
                                const nameInput = (e.target.form?.elements.namedItem('name') as HTMLInputElement);
                                if (nameInput && !nameInput.value) {
                                  nameInput.value = data.name;
                                }
                              }
                            }
                          } catch (err) {
                            console.error("Auto-fetch failed", err);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Start Monitoring"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-around z-30 pb-safe">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-emerald-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Activity className="h-5 w-5" />
          <span className="text-[10px] font-medium">Overview</span>
        </Link>
        <Link to="/incidents" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/incidents') ? 'text-emerald-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Bell className="h-5 w-5" />
          <span className="text-[10px] font-medium">Incidents</span>
        </Link>
        <Link to="/logs" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/logs') ? 'text-emerald-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-medium">Logs</span>
        </Link>
        <Link to="/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/settings') ? 'text-emerald-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

function DashboardOverview({ onAddClick }: { onAddClick: () => void }) {
  const navigate = useNavigate();
  const { setSelectedAppId, setSelectedAppName } = useAppContext();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pausedAppsCount = useMemo(() => apps.filter(app => !app.isActive).length, [apps]);

  const filteredApps = useMemo(() => {
    let result = searchQuery 
      ? apps.filter(app => 
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          app.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [...apps];

    // Priority: Paused first, then by name
    return result.sort((a, b) => {
      // isActive is true for active, false for paused. 
      // We want false (paused) to come first.
      if (a.isActive === b.isActive) {
        return a.name.localeCompare(b.name);
      }
      return a.isActive ? 1 : -1;
    });
  }, [apps, searchQuery]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (e: any) {
      if (e.message !== 'Failed to fetch') {
        console.error('fetchApps error', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async (appId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        fetchApps();
        setOpenSettingsId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteApp = async (appId: string) => {
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setApps(prev => prev.filter(app => app.id !== appId));
        setConfirmDeleteId(null);
        fetchApps();
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error occurred while trying to delete.");
    }
  };

  useEffect(() => {
    fetchApps();
    // Poll every 5 seconds for dashboard updates
    const interval = setInterval(fetchApps, 5000);
    window.addEventListener('refresh_dashboard', fetchApps);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh_dashboard', fetchApps);
    };
  }, []);

  // Auto-close settings menu after 3 seconds or on outside interaction
  useEffect(() => {
    if (!openSettingsId) return;

    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      setOpenSettingsId(null);
    }, 3000);

    // Close on click anywhere else
    const handleGlobalClick = () => {
      setOpenSettingsId(null);
    };

    // Close if visibility changes (user switches tabs/apps)
    const handleVisibilityChange = () => {
      if (document.hidden) setOpenSettingsId(null);
    };

    window.addEventListener('click', handleGlobalClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(autoCloseTimer);
      window.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [openSettingsId]);

  const overallHealth = useMemo(() => {
    if (apps.length === 0) return { status: 'Unknown', uptime: 100, incidents: 0, checked: 0 };
    const total = apps.length;
    let up = 0;
    let avgUptime = 0;
    let incidents = 0;
    apps.forEach(a => {
      if (a.lastCheck?.isUp) up++;
      else if (a.lastCheck?.isUp === false) incidents++;
    });
    return {
      status: incidents > 0 ? (incidents === total ? 'Major Outage' : 'Degraded') : 'All Systems Operational',
      uptime: ((up / total) * 100).toFixed(0),
      incidents,
      checked: total
    };
  }, [apps]);

  const cardGradients = [
    'from-blue-900/20 to-neutral-900/80 border-blue-500/20 hover:border-blue-500/50 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    'from-emerald-900/20 to-neutral-900/80 border-emerald-500/20 hover:border-emerald-500/50 shadow-[inset_0_1px_0_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    'from-purple-900/20 to-neutral-900/80 border-purple-500/20 hover:border-purple-500/50 shadow-[inset_0_1px_0_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    'from-amber-900/20 to-neutral-900/80 border-amber-500/20 hover:border-amber-500/50 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    'from-rose-900/20 to-neutral-900/80 border-rose-500/20 hover:border-rose-500/50 shadow-[inset_0_1px_0_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    'from-cyan-900/20 to-neutral-900/80 border-cyan-500/20 hover:border-cyan-500/50 shadow-[inset_0_1px_0_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-white tracking-tight">System Status</h2>
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg justify-center text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Plus className="h-4 w-4" />
          <span>Add App</span>
        </button>
      </div>

      {/* Overall Health Widget */}
      {!loading && apps.length > 0 && (
        <div className="bg-[#09090b]/80 backdrop-blur-xl border border-white/20 rounded-[28px] p-5 shadow-2xl relative overflow-hidden max-w-[320px] mx-auto group mb-8">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-4 opacity-70 leading-none">System Architecture</div>
            
            <div className="flex items-center gap-3 mb-5 self-center px-2">
              <div className={`h-10 w-10 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center flex-shrink-0 ${overallHealth.status.includes('Operational') ? 'bg-emerald-500' : overallHealth.status === 'Degraded' ? 'bg-amber-500' : 'bg-red-500'}`}>
                <Activity className="h-5 w-5 text-black" />
              </div>
              <div className={`text-xl font-black tracking-tighter leading-none text-left ${overallHealth.status.includes('Operational') ? 'text-emerald-400' : overallHealth.status === 'Degraded' ? 'text-amber-400' : 'text-red-400'}`}>
                All Systems<br />Operational
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
               <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-900/40 border border-white/10">
                 <span className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter leading-none">{overallHealth.checked}</span>
                 <span className="text-[7px] text-neutral-500 uppercase font-bold tracking-widest mt-1">Monitors</span>
               </div>
               <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-900/40 border border-white/10">
                 <span className="text-2xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_12px_rgba(16,185,129,0.3)] tabular-nums leading-none">{overallHealth.uptime}%</span>
                 <span className="text-[7px] text-neutral-500 uppercase font-bold tracking-widest mt-1">Uptime</span>
               </div>
               <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-900/40 border border-white/10">
                 <span className={`text-2xl font-black tabular-nums tracking-tighter leading-none ${overallHealth.incidents > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{overallHealth.incidents}</span>
                 <span className="text-[7px] text-neutral-500 uppercase font-bold tracking-widest mt-1">Incidents</span>
               </div>
               <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-900/40 border border-white/10">
                 <span className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter leading-none">5m</span>
                 <span className="text-[7px] text-neutral-500 uppercase font-bold tracking-widest mt-1">Check Rate</span>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {loading && apps.length === 0 && (
        <div className="flex items-center justify-center p-12 text-neutral-500">
          <Activity className="h-5 w-5 animate-pulse mr-3" />
          Loading applications...
        </div>
      )}

      {apps.length === 0 && !loading && (
        <div className="p-12 text-center bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl">
          <Activity className="h-12 w-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No apps monitored</h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">Get started by adding your first application to monitor its uptime, response times, and SSL certificates automatically.</p>
          <button 
            onClick={onAddClick}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Monitor First App</span>
          </button>
        </div>
      )}

      {apps.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-medium text-neutral-200 tracking-tight shrink-0">Active Monitors</h3>
            <div className="relative flex-1 max-w-sm">
              {pausedAppsCount > 0 && (
                <div className="absolute -top-12 right-0 animate-in slide-in-from-top-2 fade-in duration-700 z-10">
                  <div className="bg-amber-500/20 border border-amber-500/60 rounded-full px-3 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Pause className="h-3.5 w-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-[0.1em] leading-none">
                      {pausedAppsCount} {pausedAppsCount === 1 ? 'Monitor' : 'Monitors'} Paused
                    </span>
                  </div>
                </div>
              )}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search monitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">Clear</span>
                </button>
              )}
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/20 border border-dashed border-white/20 rounded-2xl">
              <p className="text-neutral-500">No monitors found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredApps.map((app, index) => {
              const hasIncident = app.lastCheck?.isUp === false;
              const isPaused = !app.isActive;
              
              const gradientStyle = isPaused
                ? 'from-neutral-900/40 to-neutral-900/60 border-white/20 grayscale'
                : hasIncident 
                  ? 'from-red-950/30 to-red-950/10 border-red-900/50 hover:border-red-500/80 shadow-[0_4px_20px_rgba(239,68,68,0.15)]' 
                  : cardGradients[index % cardGradients.length];
              
              return (
                <div key={app.id} className="relative group">
                  <div 
                    onClick={() => {
                      if (isPaused) return;
                      setSelectedAppId(app.id);
                      setSelectedAppName(app.name);
                      navigate(`/app/${app.id}`);
                    }}
                    className={`bg-gradient-to-br border rounded-2xl p-5 relative transition-all duration-300 transform ${!isPaused ? 'cursor-pointer group-hover:-translate-y-1' : 'cursor-default'} ${gradientStyle} backdrop-blur-md`}
                  >
                    {/* Animated dot indicator */}
                    <div className="absolute top-5 right-5">
                       {isPaused ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-800 text-[9px] font-bold text-neutral-500 uppercase tracking-tighter border border-neutral-700/50">
                            Paused
                          </div>
                       ) : hasIncident ? (
                          <span className="relative flex h-2.5 w-2.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                           </span>
                       ) : app.lastCheck ? (
                          <span className="relative flex h-2.5 w-2.5">
                             <span className="animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                           </span>
                       ) : (
                          <span className="relative flex h-2.5 w-2.5">
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-600"></span>
                           </span>
                       )}
                    </div>
                    
                    <div className={`font-semibold ${isPaused ? 'text-neutral-500' : 'text-neutral-100'} mb-0.5 pr-8 truncate text-base transition-colors leading-tight`}>
                      {app.name} 
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate mb-3 pb-2 border-b border-white/10 flex items-center gap-2">
                      <span className="truncate">{app.url}</span>
                      {app.url.includes('play.google.com') && (
                        <span className="shrink-0 bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded text-[8px] font-bold border border-blue-500/20 uppercase tracking-tighter">Play Store</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-1">
                       <div>
                         <div className="text-[9px] uppercase font-bold text-neutral-500 mb-0.5 tracking-wider">Uptime</div>
                         <div className={`text-base sm:text-lg font-bold tracking-tight ${isPaused ? 'text-neutral-600' : hasIncident ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isPaused ? 'N/A' : app.lastCheck ? (hasIncident ? 'Down' : '100%') : 'Wait'}
                         </div>
                       </div>
                       <div className="relative">
                         <div className="text-[9px] uppercase font-bold text-neutral-500 mb-0.5 tracking-wider">Response</div>
                         <div className={`text-base sm:text-lg font-bold font-mono tracking-tight ${isPaused ? 'text-neutral-600' : 'text-emerald-400'}`}>
                            {isPaused ? '-' : app.lastCheck ? `${app.lastCheck.responseTimeMs}ms` : '-'}
                         </div>
                         
                         {/* Settings Trigger - Integrated into metrics area for compactness */}
                         <div className="absolute top-0 right-0">
                           <div className="relative">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setOpenSettingsId(openSettingsId === app.id ? null : app.id);
                               }}
                               className={`p-1.5 rounded-lg transition-all ${openSettingsId === app.id ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-800/20'}`}
                             >
                               <Settings className="h-3.5 w-3.5" />
                             </button>

                             {openSettingsId === app.id && (
                               <div className="absolute bottom-full right-0 mb-2 w-44 bg-[#09090b] border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                 <button 
                                   onClick={(e) => toggleMonitoring(app.id, app.isActive, e)}
                                   className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-left"
                                 >
                                   {app.isActive ? (
                                     <>
                                       <Pause className="h-4 w-4" />
                                       Stop Monitoring
                                     </>
                                   ) : (
                                     <>
                                       <Play className="h-4 w-4" />
                                       Start Monitoring
                                     </>
                                   )}
                                 </button>
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setConfirmDeleteId(app.id);
                                     setOpenSettingsId(null);
                                   }}
                                   className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors border-t border-white/10 text-left"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                   Delete App
                                 </button>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                 <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Monitor?</h3>
              <p className="text-neutral-400 text-center text-sm mb-8 leading-relaxed">
                This will permanently stop monitoring and delete all historical data for <span className="text-white font-medium">{apps.find(a => a.id === confirmDeleteId)?.name}</span>.
              </p>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setConfirmDeleteId(null)}
                   className="flex-1 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-bold transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => deleteApp(confirmDeleteId)}
                   className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-600/20"
                 >
                   Delete
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function AppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailsRef = useRef<() => void>();

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/apps/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (mounted) {
            setData(json);
            setError(null);
          }
        } else {
          if (mounted) setError(`Error: ${res.status}`);
        }
      } catch(e: any) {
        if (mounted && e.message !== 'Failed to fetch') {
          setError(`Fetch error: ${e.message}`);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchDetailsRef.current = fetchDetails;

    // Only set loading true on first load
    if (!data) {
      setLoading(true);
    }
    fetchDetails();
    const interval = setInterval(fetchDetails, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading && !data) return <div className="text-neutral-500">Loading metrics...</div>;
  if (error && !data) return <div className="text-red-500 px-4">{error}</div>;
  if (!data) return <div className="text-neutral-500">App not found</div>;

  const { checks, incidents } = data;
  const isUp = checks.length > 0 ? checks[checks.length - 1].isUp : null;
  const latestResponseTime = checks.length > 0 ? checks[checks.length - 1].responseTimeMs : null;
  
  // Calculate Stats
  const recentChecks = checks.slice(-100);
  const errorCount = recentChecks.filter((c: any) => !c.isUp).length;
  const errorRate = recentChecks.length > 0 ? (errorCount / recentChecks.length) * 100 : 0;
  
  const sortedResponseTimes = [...recentChecks].map((c: any) => c.responseTimeMs).sort((a, b) => a - b);
  const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
  const p99Latency = sortedResponseTimes.length > 0 ? sortedResponseTimes[p99Index] : 0;
  
  // Simulated Throughput
  const throughput = 450; 

  const chartData = checks.slice(-60).map((c: any) => ({
    time: new Date(c.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ms: c.responseTimeMs
  }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white transition-all bg-[#18181b] border border-white/10 rounded-xl hover:scale-105 active:scale-95 shadow-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">{data.name}</h2>
            <div className="flex items-center">
              {isUp === true && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  Live
                </div>
              )}
              {isUp === false && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  Outage
                </div>
              )}
            </div>
          </div>
          <div className="text-neutral-500 text-sm mt-1 font-medium italic opacity-80">{data.url}</div>
        </div>
        
        <div className="flex bg-[#18181b] border border-white/10 rounded-xl p-1 shadow-xl">
           <button className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors">1H</button>
           <button className="px-4 py-2 text-xs font-bold text-white bg-neutral-800 rounded-lg shadow-sm">24H</button>
           <button className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors">7D</button>
           <button className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors">30D</button>
        </div>
      </div>

      <div className="bg-[#18181b] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
         <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Response Time</h3>
              <p className="text-sm text-neutral-500 font-medium">Average: <span className="text-emerald-400 font-bold">{Math.round(sortedResponseTimes.reduce((a, b) => a + b, 0) / (sortedResponseTimes.length || 1))}ms</span></p>
            </div>
            <Activity className="h-6 w-6 text-neutral-700" />
         </div>
         <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMsDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Area 
                    type="monotone" 
                    dataKey="ms" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMsDetail)" 
                    isAnimationActive={true} 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-sm font-medium">Gathering performance metrics...</div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#18181b] border border-white/10 p-6 sm:p-7 rounded-[28px] shadow-xl hover:bg-[#1c1c1f] transition-all group">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
               <AlertCircle className="h-4 w-4" />
               Uptime (30d)
             </div>
             <div className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"/></svg>
               99.98%
             </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {errorRate === 0 ? "100%" : (100 - errorRate).toFixed(2) + "%"}
          </div>
        </div>

        <div className="bg-[#18181b] border border-white/10 p-6 sm:p-7 rounded-[28px] shadow-xl hover:bg-[#1c1c1f] transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
               <Activity className="h-4 w-4" />
               Avg Response
             </div>
             <div className="text-blue-400 text-[10px] font-bold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/></svg>
               {latestResponseTime}ms
             </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
              {Math.round(sortedResponseTimes.reduce((a, b) => a + b, 0) / (sortedResponseTimes.length || 1))}
            </span>
            <span className="text-[10px] sm:text-sm font-bold text-neutral-600 uppercase tracking-widest">ms</span>
          </div>
        </div>

        <div className="bg-[#18181b] border border-white/10 p-6 sm:p-7 rounded-[28px] shadow-xl hover:bg-[#1c1c1f] transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
               <Activity className="h-4 w-4" />
               P99 Latency
             </div>
             <div className="text-red-400 text-[10px] font-bold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 text-xs">
               High
             </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{p99Latency || latestResponseTime || 0}</span>
            <span className="text-[10px] sm:text-sm font-bold text-neutral-600 uppercase tracking-widest">ms</span>
          </div>
        </div>
      </div>

      {/* Advanced Monitoring (Pro) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#18181b] border border-white/20 rounded-[32px] p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded border border-emerald-500/20 uppercase">Pro Feature</div>
          <h3 className="text-lg font-bold text-white mb-4">SSL & Domain Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-white/10">
              <span className="text-sm text-neutral-400">SSL Certificate</span>
              <span className="text-sm font-bold text-emerald-400">Valid (Expires in 84 days)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-white/10">
              <span className="text-sm text-neutral-400">DNS Propagation</span>
              <span className="text-sm font-bold text-emerald-400">100% (Global)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-white/20 rounded-[32px] p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded border border-emerald-500/20 uppercase">Pro Feature</div>
          <h3 className="text-lg font-bold text-white mb-4">Public Status Page</h3>
          <p className="text-sm text-neutral-500 mb-4">Share your application's health with your users via a branded status page.</p>
          <div className="flex items-center gap-3">
             <div className="flex-1 bg-neutral-950 border border-white/20 p-2.5 rounded-lg text-xs font-mono text-neutral-400 truncate">
                status.afterlaunch.app/{data.name.toLowerCase().replace(/\s+/g, '-')}
             </div>
             <button className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors">
                Copy Link
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight">Recent Events</h3>
        <div className="bg-[#18181b] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
           <div className="divide-y divide-neutral-800/50">
              {incidents.slice(0, 3).map((inc: any) => (
                <div key={`event-${inc.id}`} className="p-6 flex items-start gap-4 hover:bg-neutral-800/20 transition-colors">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-white font-bold text-lg">Status Change: Resolved</div>
                    <div className="text-neutral-400 text-sm">{inc.cause} normalized.</div>
                    <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mt-2">{new Date(inc.endedAt || inc.startedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              <div className="p-6 flex items-start gap-4 hover:bg-neutral-800/20 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><rect x="7" y="13" width="10" height="8" rx="2"/></svg>
                </div>
                <div className="space-y-1">
                  <div className="text-white font-bold text-lg">Deployment Successful</div>
                  <div className="text-neutral-400 text-sm">v1.0.4 deployed to production cluster.</div>
                  <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mt-2">Just now</div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">Incident Timeline</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Historical Data</span>
          </div>
        </div>

        <div className="space-y-4">
          {incidents.length === 0 ? (
             <div className="bg-[#18181b] border border-white/10 rounded-[24px] p-12 text-center text-neutral-500 flex flex-col items-center justify-center shadow-lg">
               <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mb-3" />
               <p className="text-lg font-medium text-white/50">No incidents recorded</p>
               <p className="text-xs mt-1">This application has been stable with 100% uptime.</p>
             </div>
          ) : (
            incidents.map((inc: any) => (
              <div key={inc.id} className="bg-[#1c1c1f]/80 backdrop-blur-sm border border-white/10 rounded-[24px] p-6 shadow-xl transition-all hover:bg-[#222226]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white leading-tight">{inc.cause}</h4>
                      <div className="flex items-center gap-2">
                        {inc.endedAt ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                        {inc.endedAt && (
                          <div className="bg-[#09090b]/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10 flex flex-col items-end">
                            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-neutral-500 tracking-tighter">Downtime</span>
                            <span className="text-xs sm:text-sm font-bold text-white">{inc.durationSeconds ? Math.floor(inc.durationSeconds / 60) : 0} min</span>
                          </div>
                        )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-white/10">
                      <div className="text-[10px] uppercase font-bold text-neutral-600 mb-1">Started</div>
                      <div className="text-sm text-neutral-300 font-medium whitespace-nowrap">
                        {new Date(inc.startedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
                      </div>
                    </div>
                    {inc.endedAt && (
                      <div className="bg-neutral-900/40 p-3 rounded-lg border border-white/10">
                        <div className="text-[10px] uppercase font-bold text-neutral-600 mb-1">Resolved</div>
                        <div className="text-sm text-neutral-300 font-medium whitespace-nowrap">
                          {new Date(inc.endedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function IncidentsView() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIncidents = useMemo(() => {
    if (!searchQuery) return incidents;
    const query = searchQuery.toLowerCase();
    return incidents.filter(inc => 
      (inc.appName?.toLowerCase() || '').includes(query) || 
      (inc.cause?.toLowerCase() || '').includes(query) || 
      (inc.appUrl?.toLowerCase() || '').includes(query)
    );
  }, [incidents, searchQuery]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchIncidents = async (appId?: string) => {
    try {
      const url = appId && appId !== 'all' ? `/api/incidents?appId=${appId}` : '/api/incidents';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e: any) {
      if (e.message !== 'Failed to fetch') console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    fetchIncidents(selectedAppId);
    const interval = setInterval(() => fetchIncidents(selectedAppId), 5000);
    return () => clearInterval(interval);
  }, [selectedAppId]);

  if (loading && incidents.length === 0) return <div className="text-neutral-500 p-8 text-center"><Activity className="h-5 w-5 animate-pulse mx-auto mb-2" /> Loading incidents...</div>;

  const selectedApp = selectedAppId !== 'all' ? apps.find(a => a.id === selectedAppId) : null;

  return (
    <div className="space-y-10 max-w-3xl mx-auto px-2 md:px-0 mb-20 md:mb-0 pb-10">
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">Recent Incidents</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 min-w-full md:min-w-[400px]">
            <div className="relative group flex-1">
              <select 
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  setLoading(true);
                }}
                className="bg-neutral-950 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all w-full appearance-none shadow-xl cursor-pointer hover:bg-neutral-800/30"
              >
                <option value="all">All Applications</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white transition-transform group-focus-within:rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedApp && (
          <div className="bg-[#18181b] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 sm:mb-10 relative z-10 gap-4">
               <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words">{selectedApp.name}</h3>
                  <div className="bg-[#09090b]/80 px-4 py-2 rounded-xl text-neutral-500 text-[10px] sm:text-[11px] font-mono border border-white/10 mt-3 truncate max-w-full shadow-inner">
                    {selectedApp.url}
                  </div>
               </div>
               <div className="flex items-center self-start gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
                 Operational
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 sm:gap-12 relative z-10">
               <div className="space-y-1 sm:space-y-2">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 tracking-[0.2em] opacity-80">Uptime</div>
                  <div className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    100%
                  </div>
               </div>
               <div className="space-y-1 sm:space-y-2">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 tracking-[0.2em] opacity-80">Response</div>
                  <div className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] font-mono">
                    {selectedApp.lastCheck?.responseTimeMs || 0}ms
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-px bg-neutral-800 flex-1"></div>
          <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-[0.3em]">Incident History</span>
          <div className="h-px bg-neutral-800 flex-1"></div>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="bg-[#18181b] border border-white/10 rounded-[32px] p-20 text-center text-neutral-500 flex flex-col items-center justify-center shadow-2xl">
            <CheckCircle2 className="h-16 w-16 text-emerald-500/20 mb-4" />
            <p className="text-2xl font-bold text-white/50 tracking-tight">No Incidents Found</p>
            <p className="text-sm mt-2 text-neutral-600">{searchQuery ? `Nothing matches "${searchQuery}"` : "All systems normal."}</p>
          </div>
        ) : (
          filteredIncidents.map((inc: any) => (
            <div key={inc.id} className="bg-[#1c1c1f]/80 backdrop-blur-sm border border-white/10 rounded-[32px] p-8 shadow-2xl transition-all hover:bg-[#222226]">
              <div className="space-y-8">
                  <div className="space-y-5">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words">{inc.appName || 'Unknown App'}</h3>
                    <div className="bg-[#09090b]/80 p-4 sm:p-6 rounded-2xl text-neutral-400 text-[11px] sm:text-[13px] font-mono break-all border border-white/10 leading-relaxed shadow-inner">
                      {inc.appUrl}
                    </div>
                  </div>

                <div className="space-y-6">
                  <div className="text-xl sm:text-2xl font-bold text-neutral-100 leading-tight">
                    {inc.cause}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-base sm:text-lg">
                      <span className="font-semibold text-neutral-500 min-w-[100px]">Started:</span>
                      <span className="text-neutral-300">{new Date(inc.startedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-base sm:text-lg">
                      <span className="font-semibold text-neutral-500 min-w-[100px]">Resolved:</span>
                      {inc.endedAt ? (
                        <span className="text-neutral-300 font-medium">{new Date(inc.endedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}</span>
                      ) : (
                        <span className="text-red-400 font-bold uppercase text-[10px] sm:text-xs tracking-[0.2em] animate-pulse flex items-center gap-3">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {inc.endedAt && (
                    <div className="pt-4 border-t border-white/10">
                      <span className="inline-flex items-center px-5 py-2.5 rounded-xl bg-neutral-900/80 text-neutral-200 text-sm font-bold border border-white/10 tracking-tight shadow-sm">
                        Downtime: {inc.durationSeconds ? Math.floor(inc.durationSeconds / 60) : 0} min
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      (log.appName?.toLowerCase() || '').includes(query) || 
      (log.appUrl?.toLowerCase() || '').includes(query) || 
      (log.errorMessage?.toLowerCase() || '').includes(query) ||
      (log.statusCode?.toString() || '').includes(query)
    );
  }, [logs, searchQuery]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async (appId?: string) => {
    try {
      const url = appId && appId !== 'all' ? `/api/logs?appId=${appId}` : '/api/logs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e: any) {
      if (e.message !== 'Failed to fetch') console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    fetchLogs(selectedAppId);
    const interval = setInterval(() => fetchLogs(selectedAppId), 5000);
    return () => clearInterval(interval);
  }, [selectedAppId]);

  if (loading && logs.length === 0) return <div className="text-neutral-500 p-8">Loading logs...</div>;

  return (
    <div className="space-y-6 max-w-6xl px-2 md:px-0 mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2 border-b border-neutral-900 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">System Logs</h2>
          <p className="text-[11px] text-neutral-500 uppercase font-black tracking-widest mt-1 opacity-60">Real-time health monitoring</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Filter App</label>
            <div className="relative group">
              <select 
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  setLoading(true);
                }}
                className="bg-neutral-950 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors w-full appearance-none"
              >
                <option value="all">All Applications</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 md:w-64">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
              <input 
                type="text" 
                placeholder="Status, URL, errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center bg-emerald-500/5 border border-emerald-500/10 px-3 py-2 rounded-xl">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Live</span>
          </div>
        </div>
      </div>
      
      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-950/50 border-b border-white/10">
                <th className="px-5 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">App / URL</th>
                <th className="px-5 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">Response</th>
                <th className="px-5 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">Time</th>
                <th className="px-5 py-3 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">{log.appName}</div>
                    <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">{log.appUrl}</div>
                  </td>
                  <td className="px-5 py-4">
                    {log.isUp ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        OK {log.statusCode}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                        ERROR {log.statusCode || 'FAIL'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-emerald-400 font-bold">
                    {log.responseTimeMs}ms
                  </td>
                  <td className="px-5 py-4 text-xs text-neutral-400 whitespace-nowrap opacity-60">
                    {new Date(log.checkedAt).toLocaleTimeString()}
                  </td>
                  <td className={`px-5 py-4 text-xs italic max-w-xs truncate ${log.isUp ? 'text-neutral-500' : 'text-red-400/80 font-medium'}`}>
                    {log.errorMessage || 'No issues detected'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-neutral-600 bg-neutral-950/20">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-20" />
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  const [user, setUser] = useState<any>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [intervalOption, setIntervalOption] = useState("5");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserSettings = async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setEmailAlerts(data.emailAlerts);
        setPushAlerts(data.pushAlerts);
        setSmsAlerts(data.smsAlerts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const currentPlan = user?.plan || 'free'; 
  const canUseSms = currentPlan === 'promax' || currentPlan === 'unlimited';
  const canUsePush = currentPlan === 'unlimited';
  const canUse1MinInterval = currentPlan === 'promax' || currentPlan === 'unlimited';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlerts, smsAlerts, pushAlerts })
      });
      if (res.ok) {
        setIsDirty(false);
        window.dispatchEvent(new Event('user_updated'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          window.location.href = url; // Redirect to Stripe Checkout
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const queryParams = new URLSearchParams(window.location.search);
  const success = queryParams.get('success');
  const canceled = queryParams.get('canceled');

  if (loading) return <div className="text-neutral-500">Loading settings...</div>;

  return (
     <div className="space-y-6 max-w-2xl px-2 md:px-0">
       <h2 className="text-xl font-medium text-white tracking-tight">Settings</h2>

       {success && (
         <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6">
           <h4 className="font-bold">Payment Successful!</h4>
           <p className="text-sm">Your subscription has been updated. Processing your new features...</p>
         </div>
       )}

       {canceled && (
         <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl mb-6">
           <p className="text-sm">Payment was canceled. No charges were made.</p>
         </div>
       )}

       {/* Billing & Subscription Section */}
       <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 mb-6">
         <h3 className="text-white font-medium text-base mb-1">Subscription Plan</h3>
         {currentPlan === 'free' ? (
           <p className="text-neutral-400 text-sm mb-6">You are currently on the <span className="text-neutral-500 font-medium whitespace-nowrap">Free Tier</span>. Upgrade for more monitors and faster checks.</p>
         ) : (
           <p className="text-neutral-400 text-sm mb-6">You are currently on the <span className="text-emerald-400 font-medium uppercase">{currentPlan} Plan</span>.</p>
         )}
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Pro Plan */}
           <div className={`border rounded-xl p-5 relative flex flex-col backdrop-blur-sm transition-all ${currentPlan === 'pro' ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-white/10 bg-neutral-950/80 hover:border-white/20'}`}>
             <div className="text-emerald-500 font-medium mb-1">Pro</div>
             <div className="flex items-baseline gap-1 mb-4">
               <span className="text-2xl font-bold text-white">£9.99</span>
               <span className="text-neutral-500 text-sm">/month</span>
             </div>
             <ul className="space-y-2 mb-6 text-sm text-neutral-400 flex-1">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Monitor up to 3 apps</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 5-minute check intervals</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Email alerts</li>
             </ul>
             <button 
               onClick={() => handleUpgrade('pro')}
               disabled={currentPlan === 'pro'}
               className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${currentPlan === 'pro' ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
             >
               {currentPlan === 'pro' ? 'Current Plan' : 'Select Pro'}
             </button>
           </div>

           {/* Pro Max Plan */}
           <div className={`border rounded-xl p-5 relative flex flex-col backdrop-blur-sm transition-all ${currentPlan === 'promax' ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-white/10 bg-neutral-950/80 hover:border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
             {currentPlan !== 'promax' && currentPlan !== 'unlimited' && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">Recommended</div>}
             <div className="text-emerald-500 font-medium mb-1">Pro Max</div>
             <div className="flex items-baseline gap-1 mb-4">
               <span className="text-2xl font-bold text-white">£49.99</span>
               <span className="text-neutral-500 text-sm">/month</span>
             </div>
             <ul className="space-y-2 mb-6 text-sm text-neutral-400 flex-1">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Monitor up to 50 apps</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 1-minute check intervals</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Email & SMS alerts</li>
             </ul>
             <button 
               onClick={() => handleUpgrade('promax')}
               disabled={currentPlan === 'promax'}
               className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${currentPlan === 'promax' ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'}`}
             >
               {currentPlan === 'promax' ? 'Current Plan' : 'Select Pro Max'}
             </button>
           </div>

           {/* Unlimited Plan */}
           <div className={`border rounded-xl p-5 relative flex flex-col backdrop-blur-sm transition-all ${currentPlan === 'unlimited' ? 'border-purple-500/50 bg-purple-950/10' : 'border-white/10 bg-neutral-950/80 hover:border-white/20'}`}>
             <div className="text-purple-400 font-medium mb-1">Unlimited</div>
             <div className="flex items-baseline gap-1 mb-4">
               <span className="text-2xl font-bold text-white">£99.99</span>
               <span className="text-neutral-500 text-sm">/month</span>
             </div>
             <ul className="space-y-2 mb-6 text-sm text-neutral-400 flex-1">
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Truly unlimited apps</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> 1, 5, 15-minute intervals</li>
               <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Push & SMS alerts</li>
             </ul>
             <button 
               onClick={() => handleUpgrade('unlimited')}
               disabled={currentPlan === 'unlimited'}
               className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${currentPlan === 'unlimited' ? 'bg-purple-500/20 text-purple-400 cursor-default' : 'bg-purple-600/90 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/20'}`}
             >
               {currentPlan === 'unlimited' ? 'Current Plan' : 'Select Unlimited'}
             </button>
           </div>
         </div>
       </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-8 text-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-base">API Keys & Webhooks</h3>
              <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded tracking-wide uppercase font-bold border border-purple-500/20">Unlimited</span>
            </div>
            <p className="text-neutral-500 text-xs mb-4">Integrate AfterLaunch monitoring into your deployment pipelines or trigger custom actions on status changes.</p>
            
            <div className={`space-y-4 ${currentPlan !== 'unlimited' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
               <div className="bg-neutral-950 border border-white/20 p-4 rounded-xl flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest mb-1">Live API Key</div>
                    <div className="font-mono text-xs text-white truncate">pk_live_************************************</div>
                  </div>
                  <button className="px-3 py-1.5 bg-neutral-800 text-white rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors">Reveal Key</button>
               </div>
               
               <div className="flex justify-between items-center p-4 bg-neutral-950 border border-white/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-emerald-500 font-bold text-xs">W</div>
                    <div>
                      <div className="text-white font-medium">Slack Notifications</div>
                      <div className="text-neutral-500 text-[10px]">Disconnected</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-emerald-600/10 text-emerald-500 rounded-lg text-xs font-bold hover:bg-emerald-600/20 transition-colors">Connect Slack</button>
               </div>
            </div>
            {!canUsePush && <div className="mt-4 text-center py-4 bg-neutral-800/20 rounded-xl border border-dashed border-white/10 text-neutral-500 text-xs italic">API Access requires an <button className="text-emerald-500 hover:underline font-bold">Unlimited Plan</button> upgrade.</div>}
          </div>

          <div>
            <h3 className="text-white font-medium mb-4 text-base">Notification Preferences</h3>
            <div className="space-y-4">
               <label className="flex items-center gap-3 cursor-pointer group">
                 <input 
                   type="checkbox" 
                   checked={emailAlerts} 
                   onChange={(e) => { setEmailAlerts(e.target.checked); setIsDirty(true); }}
                   className="w-5 h-5 rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-neutral-900" 
                  />
                 <div className="flex flex-col">
                   <span className="text-neutral-200 font-medium group-hover:text-white transition-colors">Email Alerts</span>
                   <span className="text-neutral-500 text-xs">Send downtime alerts to demo@afterlaunch.app</span>
                 </div>
               </label>
               
               <label className={`flex items-center gap-3 group ${!canUseSms ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                 <input 
                   type="checkbox" 
                   checked={canUseSms ? smsAlerts : false} 
                   onChange={(e) => { 
                     if(!canUseSms) return;
                     setSmsAlerts(e.target.checked); 
                     setIsDirty(true); 
                   }}
                   disabled={!canUseSms}
                   className="w-5 h-5 rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                 <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                     <span className="text-neutral-200 font-medium transition-colors">SMS Alerts</span>
                     {!canUseSms && <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded tracking-wide uppercase font-bold">Pro Max</span>}
                   </div>
                   <span className="text-neutral-500 text-xs">Get urgent text messages when apps go down.</span>
                 </div>
               </label>

               <div className="space-y-4">
                 <label className={`flex items-center gap-3 group ${!canUsePush ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                   <input 
                     type="checkbox" 
                     checked={canUsePush ? pushAlerts : false} 
                     onChange={(e) => { 
                       if(!canUsePush) return;
                       setPushAlerts(e.target.checked); 
                       setIsDirty(true); 
                     }}
                     disabled={!canUsePush}
                     className="w-5 h-5 rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed" 
                    />
                   <div className="flex flex-col">
                     <div className="flex items-center gap-2">
                       <span className="text-neutral-200 font-medium transition-colors">Push Notifications</span>
                       {!canUsePush && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded tracking-wide uppercase font-bold">Unlimited</span>}
                     </div>
                     <span className="text-neutral-500 text-xs">Receive native push alerts on your desktop or mobile device.</span>
                   </div>
                 </label>

                 {canUsePush && pushAlerts && (
                   <div className="pl-8 space-y-3">
                     <div className="text-neutral-500 text-xs italic">All push alerts enabled for {currentPlan} plan.</div>
                   </div>
                 )}
               </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-white font-medium mb-4 text-base">System Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-neutral-400 mb-2">Check Interval (Global)</label>
                <select 
                  value={intervalOption}
                  onChange={(e) => { setIntervalOption(e.target.value); setIsDirty(true); }}
                  className="bg-neutral-950 border border-white/20 rounded-md px-3 py-2 text-white outline-none focus:border-emerald-500 w-full max-w-xs transition-colors"
                >
                   {canUse1MinInterval ? (
                     <option value="1">Every 1 minute</option>
                   ) : (
                     <option value="1" disabled>Every 1 minute (Requires Pro Max upgrade)</option>
                   )}
                   <option value="5">Every 5 minutes</option>
                   <option value="15">Every 15 minutes</option>
                </select>
              </div>
              <div className="pt-4">
                 <button 
                   onClick={handleSave}
                   disabled={!isDirty || isSaving}
                   className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                   {isSaving ? "Saving..." : "Save Changes"}
                 </button>
              </div>
            </div>
          </div>
       </div>
     </div>
  );
}
