"use client";

import { useState } from "react";

interface LivePreviewProps {
  wrappedHtml: string;
  mobilePreviewOpen?: boolean;
}

export default function LivePreview({
  wrappedHtml,
  mobilePreviewOpen = true,
}: LivePreviewProps) {
  const [mobile, setMobile] = useState(false);
  const charCount = wrappedHtml.length;
  const isEmpty = wrappedHtml.trim().length === 0;

  return (
    <main
      className={[
        "min-h-0 flex-1 flex-col overflow-hidden bg-pale",
        mobilePreviewOpen ? "flex" : "hidden lg:flex",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-accent/20 bg-navy-mid px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="ml-2 text-xs font-medium tracking-widest text-accent-light/70 uppercase">
          Live Preview
        </span>

        <div className="ml-auto flex items-center gap-1 rounded-md bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => setMobile(false)}
            title="Desktop view"
            className={[
              "flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors",
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
              "flex items-center gap-1 rounded px-2 py-1 text-[10px] transition-colors",
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

        <span className="text-xs tabular-nums text-muted">{charCount.toLocaleString()} chars</span>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-navy/60">Preview will appear here</p>
            <p className="mt-1 text-xs text-navy/40">Start composing your email body</p>
          </div>
        </div>
      ) : (
        <div className={["flex flex-1 overflow-hidden transition-all duration-300", mobile ? "items-start justify-center bg-gray-200 px-3 py-4 sm:px-4" : ""].join(" ")}>
          <iframe
            srcDoc={wrappedHtml}
            title="Email Preview"
            className={[
              "border-0 transition-all duration-300",
              mobile
                ? "w-full max-w-[390px] flex-none rounded-xl shadow-2xl"
                : "flex-1",
            ].join(" ")}
            style={mobile ? { height: "calc(100% - 8px)" } : { height: "100%", width: "100%" }}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </main>
  );
}
