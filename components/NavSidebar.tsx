"use client";

export type NavSection = "compose" | "contacts" | "analytics" | "sequences" | "listings" | "campaigns" | "settings";

interface NavSidebarProps {
  active: NavSection;
  onChange: (s: NavSection) => void;
  scheduledCount?: number;
  smtpConfigured?: boolean;
}

const NAV: Array<{ section: NavSection; label: string; icon: React.ReactNode }> = [
  {
    section: "compose",
    label: "Compose",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
      </svg>
    ),
  },
  {
    section: "campaigns",
    label: "Campaigns",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    section: "contacts",
    label: "Contacts",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    section: "analytics",
    label: "Analytics",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    section: "sequences",
    label: "Drip Sequences",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" y1="9" x2="6" y2="21" />
      </svg>
    ),
  },
  {
    section: "listings",
    label: "Property Discovery",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function NavSidebar({ active, onChange, scheduledCount, smtpConfigured }: NavSidebarProps) {
  return (
    <nav className="w-14 shrink-0 bg-navy border-r border-white/8 flex flex-col items-center py-4 gap-1 z-10">
      {/* Logo mark */}
      <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center mb-3 shrink-0">
        <span className="font-serif text-accent text-base font-bold leading-none">H</span>
      </div>

      {NAV.map(({ section, label, icon }) => (
        <button
          key={section}
          type="button"
          onClick={() => onChange(section)}
          title={label}
          className={[
            "relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors group",
            active === section
              ? "bg-accent text-white"
              : "text-white/30 hover:text-white hover:bg-white/8",
          ].join(" ")}
        >
          {icon}
          {section === "sequences" && scheduledCount && scheduledCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 text-black text-[8px] flex items-center justify-center font-bold">
              {scheduledCount > 9 ? "9+" : scheduledCount}
            </span>
          ) : null}
          {section === "compose" && smtpConfigured ? (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-navy" title="SMTP configured" />
          ) : null}
          <span className="absolute left-full ml-2 px-2 py-1 rounded bg-black/80 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
            {label}
          </span>
        </button>
      ))}

      {/* Settings at bottom */}
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => onChange("settings")}
          title="Settings"
          className={[
            "relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors group",
            active === "settings"
              ? "bg-accent text-white"
              : "text-white/30 hover:text-white hover:bg-white/8",
          ].join(" ")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="absolute left-full ml-2 px-2 py-1 rounded bg-black/80 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}
