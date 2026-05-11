"use client";

import { useState } from "react";
import type { SendLogEntry } from "@/types/email";

interface SendLogModalProps {
  log: SendLogEntry[];
  onClear: () => void;
  onClose: () => void;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SendLogModal({ log, onClear, onClose }: SendLogModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const successCount = log.filter((e) => e.status === "success").length;
  const errorCount = log.filter((e) => e.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Send History</p>
            <p className="text-white/35 text-[10px] tracking-[0.12em] uppercase mt-0.5">
              {log.length} total &nbsp;·&nbsp;
              <span className="text-green-400/70">{successCount} sent</span>
              {errorCount > 0 && (
                <> &nbsp;·&nbsp; <span className="text-red-400/70">{errorCount} failed</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {confirmClear ? (
              <>
                <button
                  type="button"
                  onClick={() => { onClear(); setConfirmClear(false); }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Confirm clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-white/30 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              log.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-white/25 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white transition-colors text-lg leading-none ml-1"
            >
              ×
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto">
          {log.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <p className="text-white/30 text-sm">No emails sent yet.</p>
              <p className="text-white/20 text-xs">Your send history will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {log.map((entry) => (
                <div key={entry.id} className="px-5 py-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={[
                        "mt-0.5 shrink-0 text-xs font-bold",
                        entry.status === "success" ? "text-green-400" : "text-red-400",
                      ].join(" ")}
                    >
                      {entry.status === "success" ? "✓" : "✕"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-white/85 text-xs font-medium truncate flex-1">
                          {entry.to}
                          {entry.cc && <span className="text-white/35 ml-1 font-normal">cc: {entry.cc}</span>}
                        </p>
                        <p className="text-white/25 text-[10px] shrink-0 tabular-nums">
                          {formatDateTime(entry.timestamp)}
                        </p>
                      </div>
                      <p className="text-white/40 text-[11px] mt-0.5 truncate">{entry.subject}</p>
                      {entry.status === "error" && entry.error && (
                        <p className="text-red-400/70 text-[10px] mt-0.5 leading-snug">{entry.error}</p>
                      )}
                      {entry.messageId && (
                        <p className="text-white/20 text-[10px] mt-0.5 font-mono truncate">ID: {entry.messageId}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
