"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") ?? "");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!email) { setStatus("error"); return; }
    fetch("/api/optouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "#0b1f3a" }}>
      <div className="max-w-sm text-center">
        <p style={{ fontFamily: "Georgia, serif", color: "#fff", fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
          Hasker &amp; Co.
        </p>
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "0 auto 32px", width: 80 }} />

        {status === "loading" && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Processing…</p>
        )}
        {status === "done" && (
          <>
            <p style={{ color: "#fff", fontSize: 16, marginBottom: 12 }}>{"You've been unsubscribed."}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong> has been removed from our marketing list. You will not receive further emails from Hasker &amp; Co. Realty Group.
            </p>
          </>
        )}
        {status === "error" && (
          <p style={{ color: "#f87171", fontSize: 13 }}>
            Something went wrong. Please contact{" "}
            <a href="mailto:info@haskerrealtygroup.com" style={{ color: "#93c5fd" }}>info@haskerrealtygroup.com</a>.
          </p>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0b1f3a" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading…</p>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
