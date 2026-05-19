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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
      </svg>
    ),
  },
  {
    section: "campaigns",
    label: "Campaigns",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    section: "contacts",
    label: "Contacts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    section: "sequences",
    label: "Sequences",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" y1="9" x2="6" y2="21" />
      </svg>
    ),
  },
  {
    section: "listings",
    label: "Properties",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function NavSidebar({ active, onChange, scheduledCount }: NavSidebarProps) {
  return (
    <nav
      className="
        flex shrink-0 items-center gap-1 overflow-x-auto
        border-b border-white/[0.07] px-3 py-3
        bg-[#060e1d]
        lg:h-full lg:w-[200px] lg:flex-col lg:items-stretch
        lg:overflow-visible lg:border-b-0 lg:border-r lg:border-white/[0.07]
        lg:px-3 lg:py-5 lg:gap-0
      "
    >
      {/* Brand mark */}
      <div className="flex shrink-0 items-center gap-2.5 lg:mb-7 lg:px-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#1A56DB] to-[#1A56DB]/70 shadow-lg shadow-accent/20">
          <span className="font-serif text-white text-[15px] font-bold leading-none">H</span>
        </div>
        <div className="hidden lg:block">
          <p className="font-serif text-[13px] font-semibold text-white leading-tight tracking-wide">Hasker</p>
          <p className="text-[10px] text-white/30 leading-tight mt-0.5 tracking-widest uppercase">& Co.</p>
        </div>
      </div>

      {/* Section label */}
      <p className="hidden lg:block mb-1.5 px-1 text-[10px] font-semibold tracking-[0.18em] text-white/25 uppercase">
        Navigation
      </p>

      {/* Nav items */}
      {NAV.map(({ section, label, icon }) => (
        <button
          key={section}
          type="button"
          onClick={() => onChange(section)}
          title={label}
          className={[
            "group relative flex h-9 min-w-9 items-center gap-3 rounded-[9px] px-2 py-2",
            "transition-all duration-150 ease-out",
            "lg:w-full lg:px-3",
            active === section
              ? "bg-accent/[0.18] text-white"
              : "text-white/35 hover:bg-white/[0.06] hover:text-white/85",
          ].join(" ")}
        >
          {/* Active indicator pill */}
          {active === section && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent hidden lg:block" />
          )}

          <span className="shrink-0">{icon}</span>

          <span className="hidden lg:block text-[13px] font-medium leading-none">
            {label}
          </span>

          {/* Badge for sequences/pending */}
          {section === "sequences" && scheduledCount && scheduledCount > 0 ? (
            <span className="ml-auto hidden lg:flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400/90 text-black text-[9px] font-bold px-1">
              {scheduledCount > 9 ? "9+" : scheduledCount}
            </span>
          ) : null}

          {/* Tooltip on mobile (icon-only) */}
          <span className="lg:hidden absolute left-full ml-2 z-50 pointer-events-none rounded-md bg-navy/95 px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-white/10">
            {label}
          </span>
        </button>
      ))}

      {/* Settings pinned to bottom */}
      <div className="lg:mt-auto lg:pt-4 lg:border-t lg:border-white/[0.07]">
        <button
          type="button"
          onClick={() => onChange("settings")}
          title="Settings"
          className={[
            "group relative flex h-9 min-w-9 items-center gap-3 rounded-[9px] px-2 py-2",
            "transition-all duration-150 ease-out",
            "lg:w-full lg:px-3",
            active === "settings"
              ? "bg-accent/[0.18] text-white"
              : "text-white/35 hover:bg-white/[0.06] hover:text-white/85",
          ].join(" ")}
        >
          {active === "settings" && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent hidden lg:block" />
          )}
          <span className="shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="hidden lg:block text-[13px] font-medium leading-none">Settings</span>
          <span className="lg:hidden absolute left-full ml-2 z-50 pointer-events-none rounded-md bg-navy/95 px-2 py-1 text-[11px] whitespace-nowrap text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-white/10">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}
