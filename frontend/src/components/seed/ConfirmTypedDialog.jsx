import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmTypedDialog({
  isOpen,
  title,
  description,
  expectedText,
  confirmButtonText = "Confirm Action",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  const [typedValue, setTypedValue] = useState("");

  if (!isOpen) return null;

  const isValid = typedValue.trim().toUpperCase() === expectedText.trim().toUpperCase();

  const handleConfirm = () => {
    if (!isValid || loading) return;
    onConfirm();
    setTypedValue("");
  };

  const handleCancel = () => {
    if (loading) return;
    setTypedValue("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-scaleUp">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                variant === "danger"
                  ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                  : "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Destructive Action Confirmation
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {description}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Please type <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-rose-600 dark:text-rose-400 select-all font-bold">{expectedText}</code> to confirm:
          </label>
          <input
            type="text"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            placeholder={`Type "${expectedText}" here`}
            disabled={loading}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-slate-400"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              isValid && !loading
                ? variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            {loading ? "Executing..." : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
