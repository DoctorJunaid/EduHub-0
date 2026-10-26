import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  Keyboard,
  Clock,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

/**
 * Play a clean, synthetic audio cue using the Web Audio API
 */
function playAudioFeedback(type = "success") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "success") {
      // Crisp 2-tone pleasant chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "warning") {
      // Double low beep for already marked
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Low buzz for error / rejected
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }

    if (navigator.vibrate) {
      if (type === "success") navigator.vibrate(60);
      else if (type === "warning") navigator.vibrate([40, 60, 40]);
      else navigator.vibrate(120);
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export default function QRAttendanceScanner({
  open = true,
  onClose,
  endpoint = "/campus-admin/attendance/qr-scan",
  classScope = null, // { classId, className, section }
  onAttendanceMarked,
}) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "manual"
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [targetStatus, setTargetStatus] = useState("Present"); // "Present" | "Late"

  // Scanner Hardware State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Input State
  const [manualRoll, setManualRoll] = useState("");
  const [manualClass, setManualClass] = useState(classScope?.className || "");
  const [manualSection, setManualSection] = useState(classScope?.section || "");

  // Feedback State
  const [scanResult, setScanResult] = useState(null); // { type: "success"|"warning"|"error", title, message, student, record }
  const [recentScans, setRecentScans] = useState([]);

  const scannerRef = useRef(null);
  const lastScannedRef = useRef({ code: "", time: 0 });
  const scannerContainerId = "qr-attendance-video-region";

  /**
   * Send QR payload or manual roll to backend
   */
  const submitAttendance = useCallback(
    async (rawCode, { override = false } = {}) => {
      setIsProcessing(true);
      try {
        const payload = {
          qrPayload: rawCode,
          status: targetStatus,
          classId: classScope?.classId || classScope?.id || undefined,
          className: classScope?.className || manualClass || undefined,
          section: classScope?.section || manualSection || undefined,
          overrideIfMarked: override,
        };

        const res = await axiosInstance.post(endpoint, payload);
        const data = res.data;

        if (data.alreadyMarked) {
          if (soundEnabled) playAudioFeedback("warning");
          const warningResult = {
            type: "warning",
            title: "Already Recorded Today",
            message: data.message,
            student: data.student,
            record: data.record,
            rawCode,
          };
          setScanResult(warningResult);
        } else {
          if (soundEnabled) playAudioFeedback("success");
          const successResult = {
            type: "success",
            title: "Attendance Confirmed",
            message: data.message,
            student: data.student,
            record: data.record,
          };
          setScanResult(successResult);

          // Add to recent scans list
          setRecentScans((prev) => [
            {
              id: data.record?.id || Date.now(),
              studentName: data.student?.name || "Student",
              rollNo: data.student?.rollNo || "—",
              className: data.student?.className || "Class",
              section: data.student?.section || "A",
              status: data.record?.status || targetStatus,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              method: data.record?.method || "qr_scan",
            },
            ...prev.slice(0, 19),
          ]);

          if (onAttendanceMarked) {
            onAttendanceMarked(data);
          }
        }
      } catch (err) {
        if (soundEnabled) playAudioFeedback("error");
        const errMsg = err.response?.data?.message || err.message || "Failed to record attendance";
        setScanResult({
          type: "error",
          title: "Scan Rejected",
          message: errMsg,
          code: err.response?.data?.code || "ERROR",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [classScope, endpoint, manualClass, manualSection, onAttendanceMarked, soundEnabled, targetStatus]
  );

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {}
            scannerRef.current = null;
            setCameraActive(false);
          });
      } else {
        scannerRef.current = null;
        setCameraActive(false);
      }
    }
  }, []);

  /**
   * Initialize Camera Scanner
   */
  useEffect(() => {
    if (!open || activeTab !== "camera") {
      stopCamera();
      return;
    }

    let isMounted = true;
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        setCameraError("");
        setCameraActive(false);

        // Ensure container exists in DOM
        const container = document.getElementById(scannerContainerId);
        if (!container) return;

        html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode },
          config,
          (decodedText) => {
            if (!isMounted) return;

            // Debounce same QR code within 3 seconds to avoid double-triggering
            const now = Date.now();
            if (
              lastScannedRef.current.code === decodedText &&
              now - lastScannedRef.current.time < 3000
            ) {
              return;
            }

            lastScannedRef.current = { code: decodedText, time: now };
            submitAttendance(decodedText);
          },
          () => {
            // Frame scan failure (no QR code in frame), suppress console noise
          }
        );

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Camera start warning:", err);
          setCameraActive(false);
          setCameraError(
            err.message?.includes("Permission") || err.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access in your browser or use manual roll number entry."
              : "Unable to access camera on this device. You can use manual roll number entry below."
          );
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [open, activeTab, facingMode, submitAttendance, stopCamera]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualRoll.trim()) return;
    submitAttendance(manualRoll.trim());
    setManualRoll("");
  };

  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  QR Attendance Scanner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {classScope?.className
                  ? `Class: ${classScope.className} ${classScope.section ? `• ${classScope.section}` : ""}`
                  : "Institutional Real-Time Student Attendance"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute beep" : "Unmute beep"}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status / Mode Toggle Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-neutral-100/70 dark:bg-neutral-800/40 border-b border-neutral-200/60 dark:border-neutral-800 text-xs gap-3">
          {/* Method Tabs */}
          <div className="flex items-center bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                activeTab === "camera"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                activeTab === "manual"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual Roll No</span>
            </button>
          </div>

          {/* Attendance Status Selector (Present vs Late) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-500">Mark as:</span>
            <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setTargetStatus("Present")}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  targetStatus === "Present"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
                }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setTargetStatus("Late")}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  targetStatus === "Late"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
                }`}
              >
                Late
              </button>
            </div>

            {activeTab === "camera" && (
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Switch Camera (Front / Back)"
                className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* CAMERA TAB */}
          {activeTab === "camera" && (
            <div className="flex flex-col items-center">
              {/* Live Scanner Region */}
              <div className="relative w-full max-w-sm aspect-square bg-neutral-950 rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-inner flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Reticle Overlay */}
                {cameraActive && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-blue-500/80 rounded-2xl relative shadow-lg">
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-blue-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-blue-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-blue-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-blue-400 rounded-br" />
                      <div className="w-full h-0.5 bg-blue-400/70 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Loading / Processing Indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 text-white">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-xs font-semibold">Validating Student QR...</span>
                  </div>
                )}

                {/* Camera Error / Fallback Card */}
                {cameraError && (
                  <div className="absolute inset-0 bg-neutral-900 p-6 flex flex-col items-center justify-center text-center text-neutral-300 gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-950/70 border border-red-800 text-red-400 flex items-center justify-center">
                      <CameraOff className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("manual")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Use Manual Roll Number</span>
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-neutral-500 mt-2 text-center">
                Point student card QR code directly at the camera. Attendance is recorded instantly upon verification.
              </p>
            </div>
          )}

          {/* MANUAL ENTRY TAB */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="max-w-md mx-auto space-y-3 py-2">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Student Roll Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualRoll}
                      onChange={(e) => setManualRoll(e.target.value)}
                      placeholder="e.g. 1, 2, EH-90214"
                      autoFocus
                      className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Enter the official roll number printed on the student card.
                  </span>
                </div>

                {!classScope && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Class (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualClass}
                        onChange={(e) => setManualClass(e.target.value)}
                        placeholder="e.g. Class 1"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Section (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualSection}
                        onChange={(e) => setManualSection(e.target.value)}
                        placeholder="e.g. Section A"
                        className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!manualRoll.trim() || isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Attendance</span>
                </button>
              </div>
            </form>
          )}

          {/* SCAN RESULT BANNER */}
          {scanResult && (
            <div
              className={`p-3.5 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                scanResult.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100"
                  : scanResult.type === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-950 dark:text-red-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {scanResult.type === "success" && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {scanResult.type === "warning" && (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  {scanResult.type === "error" && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold">{scanResult.title}</h4>
                    {scanResult.record?.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          scanResult.record.status === "Present"
                            ? "bg-emerald-200/80 text-emerald-900"
                            : scanResult.record.status === "Late"
                            ? "bg-amber-200/80 text-amber-900"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {scanResult.record.status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    {scanResult.message}
                  </p>

                  {/* Student Details Card if resolved */}
                  {scanResult.student && (
                    <div className="mt-2.5 pt-2.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                          {scanResult.student.avatar ? (
                            <img
                              src={scanResult.student.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            scanResult.student.name?.[0] || "S"
                          )}
                        </div>
                        <div>
                          <span className="font-bold block">{scanResult.student.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">
                            Roll #{scanResult.student.rollNo} • {scanResult.student.className} (
                            {scanResult.student.section})
                          </span>
                        </div>
                      </div>

                      {scanResult.type === "warning" && scanResult.rawCode && (
                        <button
                          type="button"
                          onClick={() => submitAttendance(scanResult.rawCode, { override: true })}
                          disabled={isProcessing}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RECENT SCANS SESSION DRAWER */}
          {recentScans.length > 0 && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Session Scans ({recentScans.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecentScans([])}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  Clear History
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {recentScans.map((item, idx) => (
                  <div key={idx} className="px-3.5 py-1.5 flex items-center justify-between hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-neutral-500">#{item.rollNo}</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.studentName}</span>
                      <span className="text-[10px] text-neutral-400">
                        {item.className}-{item.section}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "Present"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-neutral-500">
            Records are automatically saved and synchronized with database reports.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-xs"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
}
