"use client";

import { useMemo } from "react";
import type { SendLogEntry, TrackingEvent, Contact } from "@/types/email";

interface AnalyticsPanelProps {
  sendLog: SendLogEntry[];
  contacts: Contact[];
  trackingEvents: TrackingEvent[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-5">
      <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/35 mb-2">{label}</p>
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  const h = 72;
  const bw = 8;
  const gap = 3;
  const totalW = values.length * (bw + gap);

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${totalW} ${h + 20}`} preserveAspectRatio="none" style={{ minWidth: totalW }}>
        {values.map((v, i) => {
          const barH = Math.max((v / max) * h, v > 0 ? 3 : 0);
          const x = i * (bw + gap);
          return (
            <g key={i}>
              <rect x={x} y={h - barH} width={bw} height={barH} fill="hsl(43,74%,49%)" opacity={0.75} rx={1.5} />
              {i % 5 === 0 && (
                <text x={x + bw / 2} y={h + 14} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.2)">
                  {labels[i]?.slice(5) ?? ""}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPanel({ sendLog, contacts, trackingEvents }: AnalyticsPanelProps) {
  const stats = useMemo(() => {
    const total = sendLog.length;
    const successes = sendLog.filter((e) => e.status === "success").length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;

    const uniqueOpens = new Set(trackingEvents.filter((e) => e.type === "open").map((e) => e.sendId)).size;
    const uniqueClicks = new Set(trackingEvents.filter((e) => e.type === "click").map((e) => `${e.sendId}:${e.recipientEmail}`)).size;
    const openRate = successes > 0 ? Math.round((uniqueOpens / successes) * 100) : 0;
    const clickRate = successes > 0 ? Math.round((uniqueClicks / successes) * 100) : 0;

    return { total, successRate, openRate, clickRate };
  }, [sendLog, trackingEvents]);

  const last30 = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, count: sendLog.filter((e) => e.timestamp.startsWith(dateStr)).length });
    }
    return days;
  }, [sendLog]);

  const topSubjects = useMemo(() => {
    const counts: Record<string, number> = {};
    sendLog.filter((e) => e.status === "success").forEach((e) => {
      counts[e.subject] = (counts[e.subject] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([subject, count]) => ({ subject, count }));
  }, [sendLog]);

  const recentSends = sendLog.slice(0, 12);
  const hasTracking = trackingEvents.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#0a1929]">
      <div className="shrink-0 border-b border-white/8 px-4 pb-5 pt-7 sm:px-6 lg:px-8">
        <h1 className="text-white text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-white/35 text-xs mt-0.5">Campaign performance overview</p>
      </div>

      <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Sent" value={stats.total.toLocaleString()} sub={`${sendLog.filter(e => e.status === "success").length} successful`} />
          <StatCard label="Success Rate" value={`${stats.successRate}%`} sub={`${sendLog.filter(e => e.status === "error").length} failed`} />
          <StatCard label="Contacts" value={contacts.length.toLocaleString()} sub={`${contacts.filter(c => c.tags.includes("Lead")).length} leads`} />
          <StatCard
            label={hasTracking ? "Open Rate" : "Tracking"}
            value={hasTracking ? `${stats.openRate}%` : "—"}
            sub={hasTracking ? `${stats.clickRate}% click rate` : "Deploy app for tracking"}
          />
        </div>

        {/* Activity chart */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-5">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/35 mb-4">Emails Sent — Last 30 Days</p>
          {last30.every(d => d.count === 0) ? (
            <p className="text-white/20 text-sm text-center py-8">No emails sent in the last 30 days.</p>
          ) : (
            <BarChart values={last30.map(d => d.count)} labels={last30.map(d => d.date)} />
          )}
        </div>

        {/* Bottom tables */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Top subject lines */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-5">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/35 mb-4">Top Subject Lines</p>
            {topSubjects.length === 0 ? (
              <p className="text-white/20 text-xs">No sends yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topSubjects.map(({ subject, count }) => (
                  <div key={subject} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1 rounded-full bg-accent/30" style={{ width: Math.max((count / (topSubjects[0]?.count ?? 1)) * 60, 6) }} />
                      <span className="text-[10px] text-white/40 tabular-nums w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent sends */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-5">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/35 mb-4">Recent Sends</p>
            {recentSends.length === 0 ? (
              <p className="text-white/20 text-xs">No sends yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentSends.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.status === "success" ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-white/60 truncate flex-1">{e.to}</span>
                    <span className="text-white/25 shrink-0 tabular-nums">{e.timestamp.slice(5, 16).replace("T", " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tracking note */}
        {!hasTracking && (
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-5 py-4">
            <p className="text-amber-300/80 text-xs leading-relaxed">
              <strong className="text-amber-300">Open & click tracking</strong> requires the app to be publicly deployed (e.g. Vercel, Railway). When deployed, tracking events will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
