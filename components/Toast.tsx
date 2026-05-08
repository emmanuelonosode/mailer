"use client";

import type { ToastState } from "@/types/email";

interface ToastProps {
  toast: ToastState;
}

export default function Toast({ toast }: ToastProps) {
  if (toast.type === null) return null;

  const isSuccess = toast.type === "success";

  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-50",
        "flex items-start gap-3",
        "px-5 py-4 rounded-xl shadow-2xl",
        "max-w-sm w-full",
        isSuccess
          ? "bg-accent text-white"
          : "bg-red-700 text-white",
      ].join(" ")}
      role="alert"
    >
      <span className="mt-0.5 shrink-0 text-base">{isSuccess ? "✓" : "✕"}</span>
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
}
