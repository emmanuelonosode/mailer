"use client";

import { useState } from "react";

interface LivePreviewProps {
  wrappedHtml: string;
}

export default function LivePreview({ wrappedHtml }: LivePreviewProps) {
  const [mobile, setMobile] = useState(false);
  const charCount = wrappedHtml.length;
  const isEmpty = wrappedHtml.trim().length === 0;

  return (
    <main className="flex flex-col h-full bg-pale overflow-hidden">
      {/* Preview toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-navy-mid border-b border-accent/20 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-accent-light/70 text-xs tracking-widest uppercase font-medium ml-2">
          Live Preview
        </span>

        {/* Mobile / Desktop toggle */}
        <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setMobile(false)}
            title="Desktop view"
            className={[
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors",
              !mobile ? "bg-accent text-white" : "text-accent-light/50 hover:text-accent-light",
            ].join(" ")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setMobile(true)}
            title="Mobile view"
            className={[
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors",
              mobile ? "bg-accent text-white" : "text-accent-light/50 hover:text-accent-light",
            ].join(" ")}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M12 18h.01" />
            </svg>
            Mobile
          </button>
        </div>

        <span className="text-muted text-xs tabular-nums">
          {charCount.toLocaleString()} chars
        </span>
      </div>

      {/* iframe preview */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div>
            <p className="text-navy/60 text-sm font-medium">Preview will appear here</p>
            <p className="text-navy/40 text-xs mt-1">Start composing your email body</p>
          </div>
        </div>
      ) : (
        <div className={["flex-1 flex overflow-hidden transition-all duration-300", mobile ? "items-start justify-center bg-gray-200 py-4" : ""].join(" ")}>
          <iframe
            srcDoc={wrappedHtml}
            title="Email Preview"
            className={[
              "border-0 transition-all duration-300",
              mobile
                ? "w-[390px] flex-none rounded-xl shadow-2xl"
                : "w-full flex-1",
            ].join(" ")}
            style={mobile ? { height: "calc(100% - 32px)" } : { height: "100%" }}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </main>
  );
}
