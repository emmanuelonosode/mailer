import { useState } from "react";
import type { EmailTemplate } from "@/types/email";

interface TemplateModalProps {
  templates: EmailTemplate[];
  currentSubject: string;
  currentHtmlBody: string;
  onSave: (name: string) => void;
  onLoad: (t: EmailTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MASTER_TEMPLATES: EmailTemplate[] = [
  {
    id: "master-1",
    name: "🌟 Cinematic Single Property",
    subject: "Just Listed: Your dream home awaits...",
    htmlBody: `
<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', Helvetica, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    <div style="padding: 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
      <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">HASKER &amp; CO.</h1>
      <p style="font-size: 12px; font-weight: 600; color: #64748b; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Exclusive Listing</p>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.2;">Discover an architectural masterpiece in the heart of the city.</h2>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 30px 0;">We are thrilled to present this extraordinary property, offering unparalleled luxury and breathtaking views. This is a rare opportunity you don't want to miss.</p>
      
      <!-- Placeholder for PropertyCardBuilder output -->
      <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px; background-color: #f1f5f9;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">👉 <strong>Use the Property Card Builder</strong> to inject the listing card here.</p>
      </div>

      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">Reply directly to this email to schedule a private showing before it hits the open market.</p>
    </div>
    <div style="background-color: #0f172a; padding: 30px; text-align: center;">
      <p style="font-size: 14px; color: #94a3b8; margin: 0;">© 2026 Hasker &amp; Co. Realty Group</p>
    </div>
  </div>
</div>
    `.trim(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "master-2",
    name: "🏙️ Multi-Property Showcase",
    subject: "Top picks for you this week",
    htmlBody: `
<div style="background-color: #0f172a; padding: 40px 20px; font-family: 'Inter', Helvetica, sans-serif; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 0 0 10px 0; letter-spacing: -0.5px;">HASKER &amp; CO.</h1>
      <div style="height: 2px; width: 40px; background-color: #3b82f6; margin: 0 auto 20px auto;"></div>
      <h2 style="font-size: 22px; font-weight: 300; color: #cbd5e1; margin: 0; line-height: 1.4;">Curated properties matching your unique lifestyle.</h2>
    </div>
    
    <!-- Placeholder for MultiListingShowcase output -->
    <div style="border: 2px dashed #334155; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 40px; background-color: #1e293b;">
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">👉 <strong>Use the Multi-Listing Showcase tool</strong> to inject a dynamic grid of properties here.</p>
    </div>
    
    <div style="text-align: center; border-top: 1px solid #334155; padding-top: 30px;">
      <p style="font-size: 14px; color: #64748b; margin: 0;">Interested in exploring more options?<br>Let's refine your search criteria.</p>
      <a href="https://haskerrealtygroup.com/contact" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: transparent; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Contact an Advisor</a>
    </div>
  </div>
</div>
    `.trim(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "master-3",
    name: "📈 Market Update Newsletter",
    subject: "This Month in Real Estate: Trends & Insights",
    htmlBody: `
<div style="background-color: #ffffff; padding: 40px 20px; font-family: Georgia, serif; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-top: 5px solid #1A56DB;">
    <div style="padding: 40px 40px 20px 40px;">
      <h1 style="font-size: 32px; font-weight: normal; color: #111111; margin: 0 0 10px 0; line-height: 1.2;">Market Insights</h1>
      <p style="font-size: 14px; color: #888888; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-family: Helvetica, Arial, sans-serif;">Hasker &amp; Co. Monthly Report</p>
    </div>
    
    <div style="padding: 20px 40px 40px 40px;">
      <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; color: #444444;">It has been an incredibly dynamic month in the real estate market. We've seen a noticeable shift in inventory levels and buyer sentiment.</p>
      
      <div style="background-color: #f9f9f9; padding: 30px; margin: 30px 0; border-left: 4px solid #1A56DB;">
        <h3 style="font-size: 20px; margin: 0 0 15px 0; font-family: Helvetica, Arial, sans-serif; color: #222222;">Key Takeaways:</h3>
        <ul style="margin: 0; padding-left: 20px; font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #555555;">
          <li>Average days on market decreased by 12%</li>
          <li>New listings surged in the downtown corridor</li>
          <li>Mortgage rates stabilized, driving renewed interest</li>
        </ul>
      </div>
      
      <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; color: #444444;">Whether you are considering buying your first home or adding to your investment portfolio, understanding these macro trends is essential.</p>
      <p style="font-size: 18px; line-height: 1.6; margin: 0; color: #444444;">Reply to this email to schedule a personalized portfolio review.</p>
    </div>
  </div>
</div>
    `.trim(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "master-4",
    name: "👋 Re-engagement Follow-up",
    subject: "Checking in, {{first_name}}!",
    htmlBody: `
<div style="background-color: #f3f4f6; padding: 50px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #374151;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
    <div style="padding: 40px;">
      <p style="font-size: 18px; font-weight: 500; color: #111827; margin: 0 0 16px 0;">Hi {{first_name}},</p>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">It's been a little while since we last spoke about your property search. I was just reviewing some of our newest listings and one in particular caught my eye — I think it perfectly matches what you were looking for.</p>
      
      <div style="border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; background-color: #f8fafc; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #64748b; margin: 0 0 12px 0;">👉 <strong>Insert the property you're thinking of here:</strong></p>
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">(Use the <strong>Listing Card</strong> tool in the sidebar to fill this space)</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Are you still interested in finding a place in this neighborhood, or have your criteria changed? I'd love to catch up and see how I can help.</p>
      
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
        <p style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 4px 0;">Best regards,</p>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Hasker &amp; Co. Realty Group</p>
      </div>
    </div>
    <div style="background-color: #f9fafb; padding: 20px 40px; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">If you'd like to stop receiving these updates, you can <a href="{{UNSUB_URL}}" style="color: #3b82f6; text-decoration: none;">unsubscribe here</a>.</p>
    </div>
  </div>
</div>
    `.trim(),
    createdAt: new Date().toISOString(),
  }
];

export default function TemplateModal({
  templates,
  currentSubject,
  currentHtmlBody,
  onSave,
  onLoad,
  onDelete,
  onClose,
}: TemplateModalProps) {
  const [saveName, setSaveName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    if (!currentSubject.trim() && !currentHtmlBody.trim()) return;
    onSave(name);
    setSaveName("");
  }

  const allTemplates = [...MASTER_TEMPLATES, ...templates];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 shrink-0 bg-white/5">
          <div>
            <p className="text-white font-semibold text-base">Template Library</p>
            <p className="text-white/40 text-[11px] tracking-[0.1em] uppercase mt-0.5">
              Premium Marketing &amp; Saved Layouts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel: Save */}
          <div className="w-[280px] shrink-0 border-r border-white/8 bg-black/20 p-5 flex flex-col">
            <p className="field-label mb-3 text-accent-light">Save Current Email</p>
            <p className="text-xs text-white/40 mb-4">Save your current editor content as a reusable template.</p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="e.g. Price Drop Alert"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveName.trim() || (!currentSubject.trim() && !currentHtmlBody.trim())}
                className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Save as Template
              </button>
            </div>
            {!currentSubject.trim() && !currentHtmlBody.trim() && (
              <p className="text-[10px] text-yellow-400/60 mt-3 p-2 bg-yellow-400/10 rounded border border-yellow-400/20">
                ⚠️ Compose a subject and body first.
              </p>
            )}
          </div>

          {/* Right panel: List */}
          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {allTemplates.map((t) => {
                const isMaster = t.id.startsWith("master-");
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border ${isMaster ? 'border-accent/30 bg-accent/5' : 'border-white/10 bg-white/5'} p-4 transition-all hover:border-white/20`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMaster ? 'text-accent-light' : 'text-white'}`}>{t.name}</p>
                        <p className="text-white/50 text-[12px] mt-1 line-clamp-2">
                          {t.subject || <em className="text-white/20">No subject</em>}
                        </p>
                        {!isMaster && (
                          <p className="text-white/30 text-[10px] mt-2 font-mono">{formatDate(t.createdAt)}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onLoad(t)}
                          className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors shadow-sm ${isMaster ? 'bg-accent text-white hover:bg-accent/80' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          Load Template
                        </button>
                        
                        {!isMaster && (
                          <>
                            {confirmDelete === t.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => { onDelete(t.id); setConfirmDelete(null); }}
                                  className="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-[10px] px-2 py-1 text-white/40 hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(t.id)}
                                className="text-[10px] text-white/30 hover:text-red-400 transition-colors mt-1"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
