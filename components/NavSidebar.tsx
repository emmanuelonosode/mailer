"use client";

export type NavSection = "compose" | "contacts" | "analytics" | "sequences" | "listings" | "campaigns" | "settings";

interface NavSidebarProps {
  active: NavSection;
  onChange: (s: NavSection) => void;
  scheduledCount?: number;
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

export default function NavSidebar({ active, onChange, scheduledCount }: NavSidebarProps) {
  return (
    <nav className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/8 bg-navy px-3 py-3 lg:w-14 lg:flex-col lg:items-center lg:gap-1 lg:overflow-visible lg:border-b-0 lg:border-r lg:px-0 lg:py-4">
      {/* Logo mark */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 lg:mb-3">
        <span className="font-serif text-accent text-base font-bold leading-none">H</span>
      </div>

      {NAV.map(({ section, label, icon }) => (
        <button
          key={section}
          type="button"
          onClick={() => onChange(section)}
          title={label}
          className={[
            "group relative flex h-9 min-w-9 items-center justify-center rounded-lg px-2 transition-colors lg:w-9 lg:px-0",
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
          <span className="hidden absolute left-full ml-2 rounded bg-black/80 px-2 py-1 text-[10px] whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity pointer-events-none z-50 group-hover:opacity-100 lg:block">
            {label}
          </span>
        </button>
      ))}

      {/* Settings at bottom */}
      <div className="lg:mt-auto">
        <button
          type="button"
          onClick={() => onChange("settings")}
          title="Settings"
          className={[
            "group relative flex h-9 min-w-9 items-center justify-center rounded-lg px-2 transition-colors lg:w-9 lg:px-0",
            active === "settings"
              ? "bg-accent text-white"
              : "text-white/30 hover:text-white hover:bg-white/8",
          ].join(" ")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="hidden absolute left-full ml-2 rounded bg-black/80 px-2 py-1 text-[10px] whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity pointer-events-none z-50 group-hover:opacity-100 lg:block">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}
