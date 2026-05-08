"use client";

interface LivePreviewProps {
  wrappedHtml: string;
}

export default function LivePreview({ wrappedHtml }: LivePreviewProps) {
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
        <span className="ml-auto text-muted text-xs tabular-nums">
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
            <p className="text-navy/40 text-xs mt-1">Start typing HTML in the body editor</p>
          </div>
        </div>
      ) : (
        <iframe
          srcDoc={wrappedHtml}
          title="Email Preview"
          className="flex-1 w-full border-0"
          sandbox="allow-same-origin"
        />
      )}
    </main>
  );
}
