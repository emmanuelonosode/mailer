"use client";

interface SmtpFieldsProps {
  host: string; onHostChange: (v: string) => void;
  port: number; onPortChange: (v: number) => void;
  secure: boolean; onSecureChange: (v: boolean) => void;
  user: string; onUserChange: (v: string) => void;
  password: string; onPasswordChange: (v: string) => void;
}

export default function SmtpFields({
  host, onHostChange,
  port, onPortChange,
  secure, onSecureChange,
  user, onUserChange,
  password, onPasswordChange,
}: SmtpFieldsProps) {
  return (
    <div className="flex flex-col gap-4">

      <div>
        <label className="field-label">Host</label>
        <input
          type="text"
          value={host}
          onChange={(e) => onHostChange(e.target.value)}
          placeholder="smtp.gmail.com"
          className="field-input"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Port + TLS on one row */}
      <div className="flex items-end gap-6">
        <div className="w-24">
          <label className="field-label">Port</label>
          <input
            type="number"
            value={port}
            onChange={(e) => onPortChange(Number(e.target.value))}
            className="field-input"
            min={1}
            max={65535}
          />
        </div>

        {/* TLS toggle — inline, no card */}
        <div className="flex items-center gap-2 pb-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={secure}
            onClick={() => onSecureChange(!secure)}
            className={[
              "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full",
              "transition-colors duration-200 focus:outline-none",
              secure ? "bg-accent" : "bg-white/20",
            ].join(" ")}
          >
            <span
              className={[
                "pointer-events-none inline-block h-3 w-3 mt-0.5 rounded-full bg-white shadow",
                "transform transition-transform duration-200",
                secure ? "translate-x-3.5" : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-accent-light/50 select-none">
            TLS
          </span>
        </div>
      </div>

      <div>
        <label className="field-label">Email Address</label>
        <input
          type="text"
          value={user}
          onChange={(e) => onUserChange(e.target.value)}
          placeholder="you@haskerrealtygroup.com"
          className="field-input"
          autoComplete="username"
          spellCheck={false}
        />
      </div>

      <div>
        <label className="field-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••••••"
          className="field-input"
          autoComplete="new-password"
        />
      </div>

    </div>
  );
}
