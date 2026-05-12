"use client";

import { useState, useEffect } from "react";

type SyncType = "all" | "leads" | "clients" | "users";

interface SyncStats {
  total?: number;
  connected?: boolean;
  error?: string;
}

interface SyncResult {
  imported?: number;
  failed?: number;
  syncedAt?: string;
  error?: string;
}

export default function HargroveSync({ onSync }: { onSync: () => void }) {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [syncType, setSyncType] = useState<SyncType>("all");
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    // Load last synced time from localStorage
    const saved = localStorage.getItem("hargrove_last_synced");
    if (saved) setLastSynced(saved);

    // Check Hargrove connection
    fetch("/api/hargrove-sync")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ error: "Cannot reach sync API" }));
  }, []);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/hargrove-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: syncType,
          // Only sync contacts updated since last sync (incremental)
          ...(lastSynced ? { updated_since: lastSynced } : {}),
        }),
      });
      const data: SyncResult = await res.json();
      setResult(data);
      if (data.syncedAt) {
        localStorage.setItem("hargrove_last_synced", data.syncedAt);
        setLastSynced(data.syncedAt);
      }
      if (!data.error) onSync();
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleFullSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/hargrove-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: syncType }),
      });
      const data: SyncResult = await res.json();
      setResult(data);
      if (data.syncedAt) {
        localStorage.setItem("hargrove_last_synced", data.syncedAt);
        setLastSynced(data.syncedAt);
      }
      if (!data.error) onSync();
    } finally {
      setSyncing(false);
    }
  }

  const isConnected = stats?.connected === true;
  const isError = !!stats?.error;

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Hargrove CRM Sync</p>
          <p className="text-[10px] text-white/35 mt-0.5">Import contacts from the Hasker &amp; Co. real estate platform</p>
        </div>
        {/* Status badge */}
        {stats === null ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/30">Connecting…</span>
        ) : isConnected ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
            ● Connected · {stats.total?.toLocaleString()} contacts available
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">● Disconnected</span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">

        {/* Error state */}
        {isError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
            <strong>Connection Error:</strong> {stats?.error}
          </div>
        )}

        {/* Sync type selector */}
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-2">Import From</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "leads", "clients", "users"] as SyncType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSyncType(t)}
                className={[
                  "text-[10px] px-3 py-1.5 rounded-md border transition-colors capitalize font-medium",
                  syncType === t
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                    : "border-white/10 text-white/35 hover:text-white hover:border-white/25",
                ].join(" ")}
              >
                {t === "all" ? "All Contacts" : t === "leads" ? "Leads Only" : t === "clients" ? "Clients Only" : "Portal Users"}
              </button>
            ))}
          </div>
        </div>

        {/* Last synced info */}
        {lastSynced && (
          <p className="text-[10px] text-white/25">
            Last synced: {new Date(lastSynced).toLocaleString()} ·{" "}
            <button
              onClick={handleFullSync}
              disabled={syncing || !isConnected}
              className="text-blue-400/70 hover:text-blue-300 underline underline-offset-2 disabled:opacity-30"
            >
              Force full re-sync
            </button>
          </p>
        )}

        {/* Result */}
        {result && (
          <div className={["rounded-lg border px-4 py-3 text-xs", result.error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"].join(" ")}>
            {result.error ? (
              <span><strong>Sync failed:</strong> {result.error}</span>
            ) : (
              <span>
                ✓ Synced <strong>{result.imported?.toLocaleString()}</strong> contacts
                {(result.failed ?? 0) > 0 && <span className="text-amber-400 ml-2">({result.failed} skipped)</span>}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSync}
          disabled={syncing || !isConnected}
          className={[
            "flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-xs font-semibold transition-all",
            syncing
              ? "bg-blue-500/20 text-blue-400/50 cursor-not-allowed"
              : isConnected
              ? "bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:border-blue-500/50"
              : "bg-white/5 text-white/20 cursor-not-allowed",
          ].join(" ")}
        >
          {syncing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8z"/>
              </svg>
              Syncing from Hargrove…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              {lastSynced ? "Sync New Contacts" : "Sync All Contacts"}
            </>
          )}
        </button>

        {/* Info note */}
        <p className="text-[10px] text-white/20 leading-relaxed">
          Contacts are matched by email and merged — existing contacts keep their data. Opt-outs are respected across both platforms.
        </p>
      </div>
    </div>
  );
}
