"use client";

import { useState, useEffect, useCallback } from "react";
import type { Contact } from "@/types/email";

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  subjectB?: string;
  html: string;
  segmentTag?: string;
  segment: string[];
  status: "draft" | "scheduled" | "sending" | "sent";
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  abTest: boolean;
  abWinner?: "a" | "b";
  followUpEnabled: boolean;
  followUpDays?: number;
  followUpSubject?: string;
  createdAt: string;
  sentAt?: string;
}

interface CampaignReport {
  opens: number;
  clicks: number;
  sends: { to: string; subject: string; status: string; sentAt: string; variant?: string }[];
}

const CONTACT_TAGS = ["Buyer", "Renter", "Investor", "Lead", "Past Client", "All Contacts"];

interface CampaignPanelProps {
  contacts: Contact[];
  senderEmail?: string;
  senderName?: string;
}

export default function CampaignPanel({ contacts, senderEmail, senderName }: CampaignPanelProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [reportCampaign, setReportCampaign] = useState<(Campaign & CampaignReport) | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectB, setSubjectB] = useState("");
  const [html, setHtml] = useState("");
  const [segmentTag, setSegmentTag] = useState("All Contacts");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [abTest, setAbTest] = useState(false);
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [followUpSubject, setFollowUpSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  function openCreate() {
    setEditCampaign(null);
    setName(""); setSubject(""); setSubjectB(""); setHtml("");
    setSegmentTag("All Contacts"); setSelectedContactIds(new Set()); setAbTest(false);
    setFollowUpEnabled(false); setFollowUpDays(3); setFollowUpSubject("");
    setShowForm(true);
  }

  function openEdit(c: Campaign) {
    setEditCampaign(c);
    setName(c.name); setSubject(c.subject); setSubjectB(c.subjectB ?? "");
    setHtml(c.html); setSegmentTag(c.segmentTag ?? "All Contacts");
    // Pre-populate specific contacts if segment array has emails
    if (c.segment && c.segment.length > 0 && !c.segmentTag) {
      const selectedIds = new Set<string>();
      c.segment.forEach(email => {
        const match = contacts.find(contact => contact.email === email);
        if (match) selectedIds.add(match.id);
      });
      setSelectedContactIds(selectedIds);
    } else {
      setSelectedContactIds(new Set());
    }
    setAbTest(c.abTest); setFollowUpEnabled(c.followUpEnabled);
    setFollowUpDays(c.followUpDays ?? 3); setFollowUpSubject(c.followUpSubject ?? "");
    setShowForm(true);
  }

  async function saveCampaign() {
    if (!name.trim() || !subject.trim() || !html.trim()) {
      showToast("Name, Subject, and Body are required.", false);
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      subjectB: abTest ? subjectB.trim() : undefined,
      html,
      // If specific contacts are selected, don't use segmentTag.
      segmentTag: selectedContactIds.size > 0 ? undefined : (segmentTag === "All Contacts" ? undefined : segmentTag),
      // Pass the specific emails as the segment array
      segment: Array.from(selectedContactIds).map(id => contacts.find(c => c.id === id)?.email).filter(Boolean) as string[],
      abTest,
      followUpEnabled,
      followUpDays: followUpEnabled ? followUpDays : undefined,
      followUpSubject: followUpEnabled ? followUpSubject.trim() : undefined,
    };

    const url = editCampaign ? `/api/campaigns/${editCampaign._id}` : "/api/campaigns";
    const method = editCampaign ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      showToast(editCampaign ? "Campaign updated." : "Campaign created.");
      setShowForm(false);
      loadCampaigns();
    } else {
      showToast("Failed to save campaign.", false);
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    loadCampaigns();
  }

  async function launchCampaign(campaign: Campaign) {
    if (!confirm(`Launch "${campaign.name}" to ${getSegmentLabel(campaign)} contacts?`)) return;
    setLaunching(campaign._id);
    const body = { senderEmail, senderName };
    const res = await fetch(`/api/campaigns/${campaign._id}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLaunching(null);
    if (res.ok) {
      const { sent, failed, skipped } = await res.json();
      showToast(`Sent: ${sent} | Failed: ${failed} | Skipped: ${skipped}`);
      loadCampaigns();
    } else {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      showToast(err.error ?? "Launch failed.", false);
    }
  }

  async function openReport(campaign: Campaign) {
    const res = await fetch(`/api/campaigns/${campaign._id}`);
    if (res.ok) {
      setReportCampaign({ ...campaign, ...(await res.json()) });
    }
  }

  function getSegmentLabel(c: Campaign) {
    if (c.segmentTag) return `${c.segmentTag} contacts`;
    return "All contacts";
  }

  function openRate(c: Campaign) {
    if (!c.sentCount) return "—";
    return `${Math.round((c.openCount / c.sentCount) * 100)}%`;
  }

  function clickRate(c: Campaign) {
    if (!c.sentCount) return "—";
    return `${Math.round((c.clickCount / c.sentCount) * 100)}%`;
  }

  const segmentCount = (tag: string) => {
    if (tag === "All Contacts") return contacts.filter(c => !c.tags?.includes("Unsubscribed")).length;
    return contacts.filter(c => c.tags?.includes(tag)).length;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white">Campaigns</h2>
          <p className="text-[11px] text-white/40 mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Campaign list */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-white/40 text-xs text-center py-12">Loading campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-white/20 text-4xl mb-3">📢</div>
            <p className="text-white/40 text-sm">No campaigns yet.</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80">
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((c) => (
              <div key={c._id} className="rounded-xl border border-white/8 bg-white/4 p-4 hover:border-white/16 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{c.name}</span>
                      <span className={[
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        c.status === "sent" ? "bg-emerald-500/20 text-emerald-400" :
                        c.status === "sending" ? "bg-amber-500/20 text-amber-400" :
                        c.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                        "bg-white/10 text-white/50"
                      ].join(" ")}>
                        {c.status}
                      </span>
                      {c.abTest && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">A/B</span>}
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 truncate">{c.subject}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{getSegmentLabel(c)}</p>
                  </div>

                  {/* Stats */}
                  {c.status === "sent" && (
                    <div className="flex gap-4 shrink-0 text-center">
                      <div>
                        <div className="text-sm font-semibold text-white">{c.sentCount}</div>
                        <div className="text-[10px] text-white/30">sent</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-emerald-400">{openRate(c)}</div>
                        <div className="text-[10px] text-white/30">opens</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-accent">{clickRate(c)}</div>
                        <div className="text-[10px] text-white/30">clicks</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/6">
                  {c.status === "draft" && (
                    <>
                      <button onClick={() => openEdit(c)} className="px-2.5 py-1 rounded text-[11px] bg-white/8 text-white/60 hover:text-white hover:bg-white/12 transition-colors">Edit</button>
                      <button
                        onClick={() => launchCampaign(c)}
                        disabled={launching === c._id}
                        className="px-2.5 py-1 rounded text-[11px] bg-accent/20 text-accent hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                      >
                        {launching === c._id ? "Sending…" : "Launch"}
                      </button>
                    </>
                  )}
                  {c.status === "sent" && (
                    <button onClick={() => openReport(c)} className="px-2.5 py-1 rounded text-[11px] bg-white/8 text-white/60 hover:text-white hover:bg-white/12 transition-colors">View Report</button>
                  )}
                  <button onClick={() => deleteCampaign(c._id)} className="ml-auto px-2.5 py-1 rounded text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1623] border border-white/12 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{editCampaign ? "Edit Campaign" : "New Campaign"}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-[11px] text-white/50 uppercase tracking-wide font-medium">Campaign Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. April Listings — Houston" className="mt-1 w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[11px] text-white/50 uppercase tracking-wide font-medium">Subject Line A</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your email subject" className="mt-1 w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-accent/60" />
              </div>

              {/* A/B Test toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={abTest} onChange={e => setAbTest(e.target.checked)} className="accent-[var(--color-accent)]" />
                <span className="text-xs text-white/60">Enable A/B subject test</span>
              </label>
              {abTest && (
                <div>
                  <label className="text-[11px] text-white/50 uppercase tracking-wide font-medium">Subject Line B</label>
                  <input value={subjectB} onChange={e => setSubjectB(e.target.value)} placeholder="Alternate subject for split test" className="mt-1 w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-accent/60" />
                </div>
              )}

              <div>
                <label className="text-[11px] text-white/50 uppercase tracking-wide font-medium">Email Body (HTML)</label>
                <textarea
                  value={html}
                  onChange={e => setHtml(e.target.value)}
                  rows={8}
                  placeholder="Paste or type your HTML email body…"
                  className="mt-1 w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-accent/60 font-mono resize-y"
                />
                <p className="text-[10px] text-white/30 mt-1">Tip: Compose your email in the Compose tab, then paste the HTML here.</p>
              </div>

              <div>
                <label className="text-[11px] text-white/50 uppercase tracking-wide font-medium">Send To Segment</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CONTACT_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setSegmentTag(tag); setSelectedContactIds(new Set()); }}
                      className={[
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        segmentTag === tag && selectedContactIds.size === 0
                          ? "bg-accent border-accent text-white"
                          : "border-white/12 text-white/50 hover:border-white/25 hover:text-white/80"
                      ].join(" ")}
                    >
                      {tag} <span className="opacity-50">({segmentCount(tag)})</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-[11px] text-white/50 uppercase tracking-wide font-medium flex justify-between">
                    <span>Or Select Specific Users</span>
                    {selectedContactIds.size > 0 && (
                      <button type="button" onClick={() => setSelectedContactIds(new Set())} className="text-accent hover:text-accent-light normal-case">Clear</button>
                    )}
                  </label>
                  <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-1 custom-scrollbar">
                    {contacts.map(c => {
                      if (c.unsubscribed) return null;
                      const isSelected = selectedContactIds.has(c.id);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            const next = new Set(selectedContactIds);
                            if (isSelected) next.delete(c.id);
                            else next.add(c.id);
                            setSelectedContactIds(next);
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded text-[11px] transition-colors ${isSelected ? "bg-accent/20 text-accent-light" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                        >
                          <span className="truncate pr-2">{c.name} ({c.email})</span>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedContactIds.size > 0 && (
                    <p className="text-[10px] text-accent-light mt-1">Sending only to {selectedContactIds.size} selected user(s). Segment tag will be ignored.</p>
                  )}
                </div>
              </div>

              {/* Follow-up automation */}
              <div className="border border-white/8 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={followUpEnabled} onChange={e => setFollowUpEnabled(e.target.checked)} className="accent-[var(--color-accent)]" />
                  <span className="text-xs text-white/70 font-medium">Auto follow-up for non-openers</span>
                </label>
                {followUpEnabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/50">Send after</span>
                      <input type="number" min={1} max={30} value={followUpDays} onChange={e => setFollowUpDays(parseInt(e.target.value) || 3)} className="w-16 bg-white/6 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-accent/60" />
                      <span className="text-[11px] text-white/50">days if no open</span>
                    </div>
                    <input value={followUpSubject} onChange={e => setFollowUpSubject(e.target.value)} placeholder="Follow-up subject line" className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-accent/60" />
                  </>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveCampaign} disabled={saving} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/80 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : editCampaign ? "Update Campaign" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportCampaign && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1623] border border-white/12 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Campaign Report — {reportCampaign.name}</h3>
              <button onClick={() => setReportCampaign(null)} className="text-white/40 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Sent", value: reportCampaign.sentCount, color: "text-white" },
                  { label: "Opens", value: reportCampaign.opens, color: "text-emerald-400" },
                  { label: "Clicks", value: reportCampaign.clicks, color: "text-accent" },
                  { label: "Bounces", value: reportCampaign.bounceCount, color: "text-red-400" },
                ].map(s => (
                  <div key={s.label} className="bg-white/4 rounded-xl p-3 text-center border border-white/8">
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              {reportCampaign.abTest && (
                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300">
                  A/B test {reportCampaign.abWinner ? `complete — Subject ${reportCampaign.abWinner.toUpperCase()} won` : "in progress — winner not yet determined"}.
                </div>
              )}
              <div className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Recent sends</div>
              <div className="space-y-1">
                {(reportCampaign.sends ?? []).slice(0, 50).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/4 transition-colors">
                    <span className={["w-2 h-2 rounded-full shrink-0", s.status === "sent" ? "bg-emerald-400" : s.status === "skipped" ? "bg-white/20" : "bg-red-400"].join(" ")} />
                    <span className="text-xs text-white/70 flex-1 truncate">{s.to}</span>
                    {s.variant && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Variant {s.variant.toUpperCase()}</span>}
                    <span className="text-[10px] text-white/30">{new Date(s.sentAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={["fixed bottom-6 right-6 px-4 py-3 rounded-xl text-xs font-medium shadow-xl z-[100]", toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"].join(" ")}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
