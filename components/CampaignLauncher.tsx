"use client";

import { useState } from "react";
import { CAMPAIGN_TEMPLATES, type CampaignTemplate } from "@/lib/campaignTemplates";

interface CampaignLauncherProps {
  onLoad: (subject: string, bodyHtml: string) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  listing: "Listings",
  followup: "Follow-up",
  promo: "Promotions",
  retention: "Retention",
};

const CATEGORY_COLORS: Record<string, string> = {
  listing: "bg-blue-500/20 text-blue-300",
  followup: "bg-amber-500/20 text-amber-300",
  promo: "bg-green-500/20 text-green-300",
  retention: "bg-purple-500/20 text-purple-300",
};

export default function CampaignLauncher({ onLoad, onClose }: CampaignLauncherProps) {
  const [selected, setSelected] = useState<CampaignTemplate | null>(null);
  const [chosenSubject, setChosenSubject] = useState("");

  function handleSelect(t: CampaignTemplate) {
    setSelected(t);
    setChosenSubject(t.subjectLines[0]);
  }

  function handleLoad() {
    if (!selected) return;
    onLoad(chosenSubject, selected.bodyHtml);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Campaign Launcher</p>
            <p className="text-white/35 text-[10px] tracking-[0.15em] uppercase mt-0.5">
              6 ready-made Hasker &amp; Co. campaign templates
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: campaign grid */}
          <div className="w-72 shrink-0 border-r border-white/8 overflow-y-auto p-4 flex flex-col gap-2">
            {CAMPAIGN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t)}
                className={[
                  "text-left rounded-lg px-4 py-3 transition-colors border",
                  selected?.id === t.id
                    ? "border-accent bg-accent/10"
                    : "border-white/6 hover:border-white/15 hover:bg-white/4",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{t.icon}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-widest ${CATEGORY_COLORS[t.category]}`}>
                    {CATEGORY_LABELS[t.category]}
                  </span>
                </div>
                <p className="text-white text-sm font-medium">{t.name}</p>
                <p className="text-white/40 text-[11px] mt-0.5 leading-snug">{t.description}</p>
              </button>
            ))}
          </div>

          {/* Right: detail pane */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <span className="text-4xl">👈</span>
                <p className="text-white/40 text-sm">Select a campaign template to get started</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-white font-semibold text-base">{selected.icon} {selected.name}</p>
                  <p className="text-white/45 text-xs mt-1">{selected.description}</p>
                </div>

                {/* Subject line picker */}
                <div>
                  <p className="field-label mb-2">Choose a subject line</p>
                  <div className="flex flex-col gap-2">
                    {selected.subjectLines.map((line) => (
                      <label
                        key={line}
                        className={[
                          "flex items-start gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer border transition-colors",
                          chosenSubject === line
                            ? "border-accent bg-accent/8"
                            : "border-white/8 hover:border-white/15",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="subject"
                          checked={chosenSubject === line}
                          onChange={() => setChosenSubject(line)}
                          className="mt-0.5 accent-accent"
                        />
                        <span className="text-white/80 text-xs leading-relaxed">{line}</span>
                      </label>
                    ))}
                  </div>
                  {/* Custom subject */}
                  <div className="mt-3">
                    <label className="field-label mb-1">Or write your own</label>
                    <input
                      type="text"
                      value={chosenSubject}
                      onChange={(e) => setChosenSubject(e.target.value)}
                      className="field-input text-xs"
                      placeholder="Custom subject line…"
                    />
                  </div>
                </div>

                {/* Placeholder hint */}
                <div className="rounded-lg bg-white/4 border border-white/8 px-4 py-3">
                  <p className="text-white/60 text-xs font-medium mb-1.5">After loading, replace these placeholders:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractPlaceholders(selected.bodyHtml + " " + selected.subjectLines.join(" ")).map((ph) => (
                      <span key={ph} className="text-[10px] font-mono bg-accent/15 text-accent-light/70 px-1.5 py-0.5 rounded">
                        {ph}
                      </span>
                    ))}
                    <span className="text-[10px] font-mono bg-white/8 text-white/40 px-1.5 py-0.5 rounded">
                      {"{{name}}"}
                    </span>
                    <span className="text-[10px] font-mono bg-white/8 text-white/40 px-1.5 py-0.5 rounded">
                      {"{{first_name}}"}
                    </span>
                  </div>
                </div>

                {/* Body preview (truncated) */}
                <div>
                  <p className="field-label mb-2">Template preview</p>
                  <div
                    className="rounded-lg border border-white/8 bg-white overflow-hidden"
                    style={{ height: "160px" }}
                  >
                    <iframe
                      srcDoc={`<style>body{font-family:Arial,sans-serif;font-size:12px;padding:12px;color:#111;line-height:1.6}table{width:100%}img{max-width:100%}</style>${selected.bodyHtml}`}
                      title="Template preview"
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
          <p className="text-white/30 text-xs">
            Placeholders like <code className="text-accent-light/50">[CITY]</code> are filled in after loading.
          </p>
          <button
            type="button"
            onClick={handleLoad}
            disabled={!selected || !chosenSubject.trim()}
            className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Load Campaign →
          </button>
        </div>
      </div>
    </div>
  );
}

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\[[A-Z_0-9]+\]/g) ?? [];
  return [...new Set(matches)].slice(0, 12);
}
