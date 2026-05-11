"use client";

import { useState, useEffect } from "react";

interface DbStats {
  contacts: number;
  templates: number;
  sendLogs: number;
  campaigns: number;
  optOuts: number;
  trackingEvents: number;
}

interface ConfigData {
  smtpConfigured: boolean;
  senderName: string;
  senderEmail: string;
  appUrl: string;
  dbConnected: boolean;
  dbError?: string;
}

interface SettingsPanelProps {
  onAppUrlChange?: (url: string) => void;
}

export default function SettingsPanel({ onAppUrlChange }: SettingsPanelProps) {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [appUrlOverride, setAppUrlOverride] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then((data: ConfigData) => {
        setConfig(data);
        const savedUrl = typeof window !== "undefined" ? localStorage.getItem("hasker_app_url") ?? "" : "";
        setAppUrlOverride(savedUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!config?.dbConnected) return;
    setLoadingStats(true);
    Promise.all([
      fetch("/api/contacts").then(r => r.json()).catch(() => []),
      fetch("/api/templates").then(r => r.json()).catch(() => []),
      fetch("/api/send-log?limit=1000").then(r => r.json()).catch(() => []),
      fetch("/api/campaigns").then(r => r.json()).catch(() => []),
      fetch("/api/optouts").then(r => r.json()).catch(() => []),
      fetch("/api/track?type=stats").then(r => r.json()).catch(() => []),
    ]).then(([contacts, templates, sendLogs, campaigns, optOuts, tracking]) => {
      setDbStats({
        contacts: Array.isArray(contacts) ? contacts.length : 0,
        templates: Array.isArray(templates) ? templates.length : 0,
        sendLogs: Array.isArray(sendLogs) ? sendLogs.length : 0,
        campaigns: Array.isArray(campaigns) ? campaigns.length : 0,
        optOuts: Array.isArray(optOuts) ? optOuts.length : 0,
        trackingEvents: Array.isArray(tracking) ? tracking.length : 0,
      });
      setLoadingStats(false);
    });
  }, [config]);

  function saveAppUrl() {
    const url = appUrlOverride.trim().replace(/\/$/, "");
    localStorage.setItem("hasker_app_url", url);
    onAppUrlChange?.(url);
    showToast("App URL saved.");
  }

  async function exportContacts() {
    const res = await fetch("/api/contacts");
    const contacts = await res.json();
    const rows = [
      ["Name", "Email", "Phone", "Company", "Tags", "City", "State", "Notes"],
      ...contacts.map((c: Record<string, unknown>) => [
        c.name ?? "", c.email ?? "", c.phone ?? "", c.company ?? "",
        Array.isArray(c.tags) ? (c.tags as string[]).join(";") : "",
        c.city ?? "", c.state ?? "", c.notes ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hasker-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function exportSendLog() {
    const res = await fetch("/api/send-log?limit=1000");
    const logs = await res.json();
    const rows = [
      ["To", "Subject", "Status", "MessageId", "Error", "Sent At"],
      ...logs.map((l: Record<string, unknown>) => [
        l.to ?? "", l.subject ?? "", l.status ?? "", l.messageId ?? "", l.error ?? "",
        l.sentAt ? new Date(l.sentAt as string).toLocaleString() : "",
      ]),
    ];
    const csv = rows.map(r => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hasker-sendlog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function clearLocalStorage() {
    if (!confirm("Clear all locally cached data (templates, logs, sequences)? MongoDB data is NOT affected.")) return;
    const keysToKeep = ["hasker_app_url"];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) localStorage.removeItem(key);
    });
    showToast("Local cache cleared. Refresh the page.");
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-white/8 shrink-0">
        <h2 className="text-sm font-semibold text-white">Settings</h2>
        <p className="text-[11px] text-white/40 mt-0.5">App configuration and data management</p>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* SMTP Status */}
        <section className="rounded-xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3">SMTP Configuration</h3>
          {config === null ? (
            <div className="text-white/30 text-xs">Loading…</div>
          ) : config.smtpConfigured ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 font-medium">Configured from environment variables</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <InfoRow label="Sender Name" value={config.senderName || "—"} />
                <InfoRow label="Sender Email" value={config.senderEmail || "—"} />
              </div>
              <p className="text-[11px] text-white/30 mt-2">
                SMTP credentials are set in <code className="bg-white/8 px-1 rounded">.env.local</code> — no UI entry needed.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-xs text-amber-400 font-medium">Not configured from environment</span>
              <span className="text-[11px] text-white/30">— enter credentials in Compose tab each session</span>
            </div>
          )}
        </section>

        {/* Database Status */}
        <section className="rounded-xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3">Database (MongoDB)</h3>
          {config === null ? (
            <div className="text-white/30 text-xs">Loading…</div>
          ) : config.dbConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 font-medium">Connected</span>
              </div>
              {loadingStats ? (
                <div className="text-white/30 text-xs">Loading stats…</div>
              ) : dbStats && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Contacts", value: dbStats.contacts },
                    { label: "Templates", value: dbStats.templates },
                    { label: "Campaigns", value: dbStats.campaigns },
                    { label: "Send Logs", value: dbStats.sendLogs },
                    { label: "Opt-Outs", value: dbStats.optOuts },
                    { label: "Tracking Events", value: dbStats.trackingEvents },
                  ].map(s => (
                    <div key={s.label} className="bg-white/4 rounded-lg p-2.5 text-center border border-white/6">
                      <div className="text-sm font-bold text-white">{s.value.toLocaleString()}</div>
                      <div className="text-[10px] text-white/40">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="text-xs text-red-400 font-medium">Not connected</span>
              </div>
              {config.dbError && (
                <p className="text-[11px] text-red-400/70 font-mono bg-red-400/5 border border-red-400/10 rounded px-2 py-1">{config.dbError}</p>
              )}
              <p className="text-[11px] text-white/30">Set <code className="bg-white/8 px-1 rounded">MONGODB_URI</code> in <code className="bg-white/8 px-1 rounded">.env.local</code> and restart the server.</p>
            </div>
          )}
        </section>

        {/* App URL override */}
        <section className="rounded-xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">App URL Override</h3>
          <p className="text-[11px] text-white/30 mb-3">
            Used for tracking pixels and unsubscribe links when <code className="bg-white/8 px-1 rounded">APP_URL</code> env var is not set.
          </p>
          <div className="flex gap-2">
            <input
              value={appUrlOverride}
              onChange={e => setAppUrlOverride(e.target.value)}
              placeholder="https://mail.haskerrealtygroup.com"
              className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-accent/60"
            />
            <button onClick={saveAppUrl} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 transition-colors">Save</button>
          </div>
        </section>

        {/* Data exports & danger zone */}
        <section className="rounded-xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3">Data & Exports</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportContacts} className="px-3 py-2 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 hover:text-white transition-colors">
              Export Contacts CSV
            </button>
            <button onClick={exportSendLog} className="px-3 py-2 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 hover:text-white transition-colors">
              Export Send Log CSV
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-red-500/20 bg-red-500/4 p-5">
          <h3 className="text-xs font-semibold text-red-400/80 uppercase tracking-wide mb-1">Danger Zone</h3>
          <p className="text-[11px] text-white/30 mb-3">Clears browser localStorage cache. MongoDB data is unaffected.</p>
          <button
            onClick={clearLocalStorage}
            className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
          >
            Clear Local Cache
          </button>
        </section>

        {/* Deployment info */}
        <section className="rounded-xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3">Production Deployment</h3>
          <div className="space-y-1.5 text-[11px] text-white/50">
            <p>1. <strong className="text-white/70">MongoDB</strong> — Create a free cluster at <span className="text-accent">mongodb.com/atlas</span> → copy connection string → set as <code className="bg-white/8 px-1 rounded">MONGODB_URI</code></p>
            <p>2. <strong className="text-white/70">Vercel</strong> — Push to GitHub → import in Vercel → add all env vars under Settings → Environment Variables</p>
            <p>3. <strong className="text-white/70">Required env vars</strong>: <code className="bg-white/8 px-1 rounded">MONGODB_URI</code>, <code className="bg-white/8 px-1 rounded">SMTP_HOST</code>, <code className="bg-white/8 px-1 rounded">SMTP_PORT</code>, <code className="bg-white/8 px-1 rounded">SMTP_USER</code>, <code className="bg-white/8 px-1 rounded">SMTP_PASSWORD</code>, <code className="bg-white/8 px-1 rounded">SENDER_EMAIL</code>, <code className="bg-white/8 px-1 rounded">APP_URL</code></p>
          </div>
        </section>
      </div>

      {toast && (
        <div className={["fixed bottom-6 right-6 px-4 py-3 rounded-xl text-xs font-medium shadow-xl z-[100]", toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"].join(" ")}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/30 uppercase tracking-wide">{label}</div>
      <div className="text-xs text-white/70 mt-0.5">{value}</div>
    </div>
  );
}
