import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Building2, Mail, Phone, User, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function ConvertLeadModal({
  open,
  lead,
  loading = false,
  onConfirm,
  onCancel,
  confirmText = "Convert to Institute",
  cancelText = "Cancel",
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !lead) return null;

  const selectedLead = lead;
  const isConverting = loading;
  const handleCloseConvertModal = onCancel;
  const handleConfirmConvert = onConfirm;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs"
      style={{ padding: "16px", boxSizing: "border-box" }}
      onClick={() => !isConverting && handleCloseConvertModal()}
    >
      <div
        className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ boxSizing: "border-box" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div
          className="w-full bg-white border-b border-neutral-200 flex items-start justify-between"
          style={{ padding: "20px 24px", gap: "14px", boxSizing: "border-box" }}
        >
          <div className="flex items-start min-w-0" style={{ gap: "14px" }}>
            {/* Neutral Enterprise Icon Container */}
            <div
              className="rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
              style={{ width: "42px", height: "42px" }}
            >
              <Building2 className="w-5 h-5 text-neutral-700 stroke-[1.75]" />
            </div>
            <div className="flex flex-col min-w-0" style={{ gap: "3px" }}>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-snug">
                Convert to Institute
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Register this partner institution and initialize live campus
                operations.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            disabled={isConverting}
            onClick={handleCloseConvertModal}
            aria-label="Close dialog"
            className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            style={{ width: "32px", height: "32px" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. MODAL BODY */}
        <div
          className="w-full bg-white flex flex-col"
          style={{ padding: "20px 24px", gap: "16px", boxSizing: "border-box" }}
        >
          {/* Inner Institution Details Card */}
          <div
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col"
            style={{
              padding: "16px 18px",
              gap: "14px",
              boxSizing: "border-box",
            }}
          >
            {/* Top Row: Institution Name & Type Badge */}
            <div
              className="flex items-start justify-between border-b border-neutral-200/80"
              style={{ paddingBottom: "12px", gap: "12px" }}
            >
              <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Institution Name
                </span>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug break-words">
                  {selectedLead.instituteName || selectedLead.name}
                </h3>
              </div>
              <span
                className="inline-flex items-center rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 shrink-0 shadow-2xs"
                style={{ padding: "3px 10px" }}
              >
                {selectedLead.type || selectedLead.instituteType || "School"}
              </span>
            </div>

            {/* Middle Grid: Representative, Email, Phone, Stage */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 text-xs text-neutral-600"
              style={{ gap: "10px 16px" }}
            >
              <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">
                  <strong className="font-medium text-neutral-700">Rep:</strong>{" "}
                  {selectedLead.fullName ||
                    selectedLead.representativeName ||
                    selectedLead.representative ||
                    selectedLead.contactPerson}
                </span>
              </div>

              <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate" title={selectedLead.email}>
                  {selectedLead.email}
                </span>
              </div>

              <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">
                  {selectedLead.phone || selectedLead.contactNumber}
                </span>
              </div>

              <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                <span className="truncate">
                  <strong className="font-medium text-neutral-700">
                    Stage:
                  </strong>{" "}
                  {selectedLead.status || "Contacted"}
                </span>
              </div>
            </div>

            {/* Bottom Quote / Inquiry Message (if present) */}
            {(selectedLead.message ||
              selectedLead.notes ||
              selectedLead.description) && (
              <div
                className="rounded-lg bg-white border border-neutral-200/80 text-xs text-neutral-500 italic leading-relaxed"
                style={{ padding: "10px 12px" }}
              >
                &ldquo;
                {selectedLead.message ||
                  selectedLead.notes ||
                  selectedLead.description}
                &rdquo;
              </div>
            )}
          </div>

          {/* Confirmation Note */}
          <p className="text-xs text-neutral-500 leading-relaxed">
            Converting this inquiry will create an official institution profile
            on EduHub, update this lead to{" "}
            <strong className="font-semibold text-neutral-800">
              Converted
            </strong>
            , and allow assigning campus administrators.
          </p>
        </div>

        {/* 3. MODAL FOOTER ACTIONS */}
        <div
          className="w-full bg-neutral-50/80 border-t border-neutral-200 flex items-center justify-end"
          style={{ padding: "14px 24px", gap: "10px", boxSizing: "border-box" }}
        >
          <button
            type="button"
            disabled={isConverting}
            onClick={handleCloseConvertModal}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors whitespace-nowrap shadow-2xs cursor-pointer disabled:opacity-50"
            style={{
              height: "38px",
              padding: "0 16px",
              boxSizing: "border-box",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isConverting}
            onClick={handleConfirmConvert}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-xs font-medium text-white transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            style={{
              height: "38px",
              padding: "0 18px",
              gap: "8px",
              boxSizing: "border-box",
            }}
          >
            {isConverting ? (
              <Spinner className="size-3.5 text-white" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-white shrink-0" />
            )}
            <span>{isConverting ? "Converting..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
