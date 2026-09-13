"use client";

import { X } from "lucide-react";

const Toast = ({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) => (
  <div className="fixed inset-x-0 bottom-6 z-1200 flex justify-center px-4">
    <div className="flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-lg">
      <span>{message}</span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-paper/60 transition hover:text-paper"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  </div>
);

export default Toast;
