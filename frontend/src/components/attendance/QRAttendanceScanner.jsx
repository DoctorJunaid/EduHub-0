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
import { normalizeImageUrl } from "@/utils/imageUrl";

/**
 * Auto-repair payload if hardware scanner dropped leading/trailing braces, quotes, or inverted case
 */
function repairPayload(raw) {
  if (!raw) return "";
  let str = (typeof raw === "object" ? JSON.stringify(raw) : String(raw)).trim();

  // Strip AIM barcode symbology identifiers (]Q1, ]C1, ]e0, ]d1) and ASCII control chars
  str = str.replace(/^\][A-Za-z0-9]{2}/, "").replace(/[\x00-\x1F\x7F]/g, " ").trim();

  // Handle multiple concatenated scans in buffer: take the last segment
  if ((str.match(/studentId|studentid|STUDENT/gi) || []).length > 1) {
    const parts = str.split(/(?=\{|\bV:|\bv:)/i).filter(Boolean);
    if (parts.length > 0) str = parts[parts.length - 1].trim();
  }

  // Check if string contains structured key-values (with or without quotes/braces/capslock)
  const studentIdMatch = str.match(
    /["']?(?:student[_-]?id|studentid|user[_-]?id|userid)["']?\s*[:=]\s*["']?([0-9a-fA-F]{24})["']?/i
  );
  if (studentIdMatch) {
    const campusIdMatch = str.match(
      /["']?(?:campus[_-]?id|campusid)["']?\s*[:=]\s*["']?([0-9a-fA-F]{24})["']?/i
    );
    const rollNoMatch = str.match(
      /["']?(?:roll[_-]?no|rollno|roll[_-]?number|rollnumber|roll)["']?\s*[:=]\s*["']?([^"',;}\r\n\s]+)["']?/i
    );
    const sigMatch = str.match(
      /["']?(?:sig|signature|token)["']?\s*[:=]\s*["']?([0-9a-fA-F]+)["']?/i
    );
    const vMatch = str.match(/\b(?:v|version)\s*[:=]\s*["']?(\d+)["']?/i);

    return JSON.stringify({
      app: "EduHub",
      v: vMatch ? parseInt(vMatch[1], 10) : 1,
      type: "STUDENT_ATTENDANCE",
      studentId: studentIdMatch[1].toLowerCase(),
      campusId: campusIdMatch ? campusIdMatch[1].toLowerCase() : "",
      rollNo: rollNoMatch ? rollNoMatch[1].trim() : "",
      sig: sigMatch ? sigMatch[1].toLowerCase() : "",
    });
  }

  // Auto-repair missing braces on JSON strings
  if (!str.startsWith("{") && (str.includes('"app"') || str.includes('"studentId"') || str.includes("studentId"))) {
    str = "{" + str;
  }
  if (str.startsWith("{") && !str.endsWith("}")) {
    str = str + "}";
  }
  if (str.includes('"type"') && !str.includes('"type":"STUDENT_ATTENDANCE"')) {
    str = str.replace(/"type"\s*:\s*"[^"]*"/, '"type":"STUDENT_ATTENDANCE"');
  }

  return str;
}

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

    if (type === "capture") {
      // Instant high-pitch optical scanner beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, now);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === "success") {
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
  const [targetStatus, setTargetStatus] = useState("Present"); // "Present" | "Late" | "Leave"

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
  const startPromiseRef = useRef(null);
  const isStoppingRef = useRef(false);
  const lastScannedRef = useRef({ code: "", time: 0 });
  const submitAttendanceRef = useRef(null);
  const scannerContainerId = "qr-attendance-video-region";

  // Ensure body scroll lock is cleanly handled and restored
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  /**
   * Send QR payload or manual roll to backend
   */
  const submitAttendance = useCallback(
    async (rawCode, { override = false } = {}) => {
      const cleanCode = typeof rawCode === "string" ? repairPayload(rawCode.trim()) : rawCode;
      if (!cleanCode) return;
      setIsProcessing(true);
      try {
        const payload = {
          qrPayload: cleanCode,
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
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
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
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to record attendance";
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
    [
      classScope,
      endpoint,
      manualClass,
      manualSection,
      onAttendanceMarked,
      soundEnabled,
      targetStatus,
    ],
  );

  useEffect(() => {
    submitAttendanceRef.current = submitAttendance;
  }, [submitAttendance]);

  // Synchronous hardware scanner buffer for handheld/desktop USB barcode & QR scanners
  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      // Ignore if user is manually typing in manual roll input or select
      const tagName = (e.target?.tagName || "").toLowerCase();
      if (tagName === "input" && e.target?.id !== "scanner-hw-input") return;
      if (tagName === "textarea" || tagName === "select") return;

      if (e.key === "Enter" || e.key === "Tab") {
        const buffered = scanBufferRef.current.trim();
        if (buffered.length > 0) {
          e.preventDefault();
          scanBufferRef.current = "";
          if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
          if (soundEnabled) playAudioFeedback("capture");
          submitAttendance(buffered);
        }
        return;
      }

      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          const current = scanBufferRef.current.trim();
          if (
            current.length >= 10 &&
            (current.includes("EduHub") || current.includes("{") || current.includes("STUDENT"))
          ) {
            scanBufferRef.current = "";
            if (soundEnabled) playAudioFeedback("capture");
            submitAttendance(current);
          }
        }, 1200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [open, soundEnabled, submitAttendance]);

  /**
   * Safely stop camera without triggering transition collisions
   */
  const stopCamera = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      // 1. If start is currently in-flight, await its completion before stopping
      if (startPromiseRef.current) {
        try {
          await startPromiseRef.current;
        } catch {
          // start failed or rejected, proceed with stop
        }
        startPromiseRef.current = null;
      }

      // 2. Stop and clear the active instance if present
      const instance = scannerRef.current;
      if (instance) {
        try {
          const state =
            typeof instance.getState === "function" ? instance.getState() : 0;
          // State 2: SCANNING, State 3: PAUSED
          if (state === 2 || state === 3 || instance.isScanning) {
            await instance.stop();
          }
        } catch (stopErr) {
          // Safely swallow "already under transition" or "not running" errors
          console.debug(
            "[QRAttendanceScanner] Safe stop error handled:",
            stopErr,
          );
        } finally {
          try {
            instance.clear();
          } catch {}
          scannerRef.current = null;
          setCameraActive(false);
        }
      }
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  /**
   * Initialize Camera Scanner with safe transition guards
   */
  useEffect(() => {
    if (!open || activeTab !== "camera") {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      if (isStoppingRef.current) return;

      try {
        setCameraError("");
        setCameraActive(false);

        // Ensure container exists in DOM
        const container = document.getElementById(scannerContainerId);
        if (!container) return;

        // Clean any stale scanner instance first
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(scannerContainerId, {
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.72);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        };

        const onScanSuccess = (decodedText) => {
          if (!decodedText) return;
          const now = Date.now();
          // Debounce same QR code read within 2.5 seconds to prevent flood
          if (
            lastScannedRef.current.code === decodedText &&
            now - lastScannedRef.current.time < 2500
          ) {
            return;
          }
          lastScannedRef.current = { code: decodedText, time: now };
          if (submitAttendanceRef.current) {
            submitAttendanceRef.current(decodedText);
          }
        };

        const onScanFailure = () => {
          // Silent frame-level miss handler
        };

        const cameraConfig = { facingMode };

        // Save reference to the start promise so stopCamera can cleanly wait for it
        const startPromise = html5QrCode.start(
          cameraConfig,
          config,
          onScanSuccess,
          onScanFailure,
        );
        startPromiseRef.current = startPromise;

        await startPromise;
        startPromiseRef.current = null;

        if (isMounted) {
          setCameraActive(true);
        } else {
          // If unmounted during start, shut down immediately
          try {
            const state =
              typeof html5QrCode.getState === "function"
                ? html5QrCode.getState()
                : 0;
            if (state === 2 || state === 3) {
              await html5QrCode.stop();
            }
            html5QrCode.clear();
          } catch {}
          scannerRef.current = null;
        }
      } catch (err) {
        startPromiseRef.current = null;
        if (isMounted) {
          console.warn("Camera start warning:", err);
          setCameraActive(false);
          setCameraError(
            err?.message?.includes("Permission") ||
              err?.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access in your browser or use manual roll number entry."
              : "Unable to access camera on this device. You can use manual roll number entry below.",
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
  }, [open, activeTab, facingMode, stopCamera]);

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
      className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      style={{ boxSizing: "border-box" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[95vw] sm:max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative"
        style={{
          maxHeight: "94vh",
          height: "auto",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar - Compact & Responsive */}
        <div
          className="w-full bg-white border-b border-neutral-200 flex items-center justify-between shrink-0"
          style={{ padding: "14px 20px", gap: "12px", boxSizing: "border-box" }}
        >
          {/* Left: QR Icon + Title & Class Subtitle */}
          <div className="flex items-center min-w-0" style={{ gap: "10px" }}>
            <div
              className="rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0"
              style={{ width: "36px", height: "36px" }}
            >
              <QrCode className="w-4 h-4 text-neutral-700 stroke-[1.75]" />
            </div>
            <div className="flex flex-col min-w-0" style={{ gap: "1px" }}>
              <div
                className="flex items-center flex-wrap"
                style={{ gap: "6px" }}
              >
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight truncate m-0">
                  QR Attendance Scanner
                </h2>
                <span
                  className="inline-flex items-center rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-semibold text-neutral-700 shrink-0"
                  style={{ padding: "1px 8px", gap: "4px" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 truncate m-0">
                Class: {classScope?.className
                  ? `${classScope.className} ${classScope.section ? `• ${classScope.section}` : ""}`
                  : "Class 7 • Section B"}
              </p>
            </div>
          </div>

          {/* Right: Audio Toggle & Close Button */}
          <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute beep" : "Unmute beep"}
              className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              style={{ width: "32px", height: "32px" }}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              style={{ width: "32px", height: "32px" }}
            >
              <X className="w-3.5 h-3.5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Status / Mode Toggle Toolbar - Single Responsive Row */}
        <div
          className="w-full bg-neutral-50/80 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between shrink-0"
          style={{ padding: "10px 20px", gap: "8px", boxSizing: "border-box" }}
        >
          {/* Left: Camera Scan / Manual Roll No Segmented Toggle */}
          <div
            className="inline-flex items-center rounded-lg bg-neutral-200/70 w-full sm:w-auto justify-center sm:justify-start shrink-0"
            style={{ padding: "3px", gap: "3px" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === "camera"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              style={{ height: "28px", padding: "0 10px", gap: "5px" }}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Camera Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === "manual"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              style={{ height: "28px", padding: "0 10px", gap: "5px" }}
            >
              <Keyboard className="w-3.5 h-3.5 shrink-0" />
              <span>Manual Roll No</span>
            </button>
          </div>

          {/* Right: Mark as Status Selector */}
          <div
            className="flex items-center justify-between sm:justify-end flex-wrap shrink-0"
            style={{ gap: "5px" }}
          >
            <span className="text-[11px] font-medium text-neutral-500 mr-1">
              Mark as:
            </span>
            <div className="inline-flex items-center" style={{ gap: "4px" }}>
              {["Present", "Late", "Leave"].map((statusOption) => {
                const active = targetStatus === statusOption;
                return (
                  <button
                    key={statusOption}
                    type="button"
                    onClick={() => setTargetStatus(statusOption)}
                    className={`inline-flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    }`}
                    style={{ height: "28px", padding: "0 9px" }}
                  >
                    {statusOption}
                  </button>
                );
              })}
              {activeTab === "camera" && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="Switch Camera (Front / Back)"
                  className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-600 transition-colors shrink-0 cursor-pointer"
                  style={{ width: "28px", height: "28px" }}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body — Overflow Hidden, Zero Scrollbars */}
        <div
          className="flex-1 flex flex-col justify-center overflow-hidden"
          style={{ boxSizing: "border-box" }}
        >
          {/* CAMERA TAB */}
          {activeTab === "camera" && (
            <div
              className="w-full bg-white flex flex-col items-center justify-center overflow-hidden shrink-0"
              style={{ padding: "16px 20px", boxSizing: "border-box" }}
            >
              {/* Live Scanner Region */}
              <div
                className="relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-inner flex items-center justify-center mx-auto"
                style={{
                  width: "min(100%, 260px)",
                  height: "clamp(200px, 34vh, 260px)",
                  boxSizing: "border-box",
                }}
              >
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Reticle Overlay */}
                {cameraActive && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className="relative border-2 border-blue-500/80 rounded-2xl shadow-lg"
                      style={{ width: "min(180px, 75%)", height: "min(180px, 75%)" }}
                    >
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-blue-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-blue-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-blue-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-blue-400 rounded-br" />
                      <div className="w-full h-0.5 bg-blue-400/70 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Loading / Processing Indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 text-white z-10">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-[11px] font-semibold">
                      Validating Student QR...
                    </span>
                  </div>
                )}

                {/* Camera Error / Fallback Card */}
                {cameraError && (
                  <div
                    className="absolute inset-0 bg-neutral-950 p-4 flex flex-col items-center justify-center text-center text-neutral-300 gap-2.5 z-10"
                    style={{ padding: "16px", boxSizing: "border-box" }}
                  >
                    <div className="w-8 h-8 rounded-full bg-red-950/70 border border-red-800 text-red-400 flex items-center justify-center shrink-0">
                      <CameraOff className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-neutral-300 max-w-[220px] leading-relaxed line-clamp-2 m-0">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("manual")}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium inline-flex items-center justify-center whitespace-nowrap shadow-xs cursor-pointer transition-colors border border-neutral-700"
                      style={{
                        height: "32px",
                        padding: "0 12px",
                        gap: "5px",
                        boxSizing: "border-box",
                      }}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Use Manual Roll Number</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANUAL ENTRY TAB */}
          {activeTab === "manual" && (
            <form
              onSubmit={handleManualSubmit}
              className="w-full flex flex-col bg-white shrink-0"
              style={{ padding: "20px", gap: "14px", boxSizing: "border-box" }}
            >
              <div className="flex flex-col w-full" style={{ gap: "5px" }}>
                <label className="text-xs font-semibold text-neutral-800">
                  Student Roll Number
                </label>
                <input
                  type="text"
                  value={manualRoll}
                  onChange={(e) => setManualRoll(e.target.value)}
                  placeholder="e.g. 1, 2, EH-90214"
                  autoFocus
                  className="w-full rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all"
                  style={{
                    height: "38px",
                    padding: "0 12px",
                    boxSizing: "border-box",
                  }}
                />
                <span className="text-[11px] text-neutral-500">
                  Enter the official roll number printed on the student card.
                </span>
              </div>

              {!classScope && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col" style={{ gap: "4px" }}>
                    <label className="text-[11px] font-medium text-neutral-600">
                      Class (Optional)
                    </label>
                    <input
                      type="text"
                      value={manualClass}
                      onChange={(e) => setManualClass(e.target.value)}
                      placeholder="e.g. Class 7"
                      className="w-full rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                      style={{
                        height: "36px",
                        padding: "0 10px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div className="flex flex-col" style={{ gap: "4px" }}>
                    <label className="text-[11px] font-medium text-neutral-600">
                      Section (Optional)
                    </label>
                    <input
                      type="text"
                      value={manualSection}
                      onChange={(e) => setManualSection(e.target.value)}
                      placeholder="e.g. Section B"
                      className="w-full rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                      style={{
                        height: "36px",
                        padding: "0 10px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!manualRoll?.trim() || isProcessing}
                className="w-full inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
                style={{
                  height: "38px",
                  padding: "0 16px",
                  gap: "6px",
                  boxSizing: "border-box",
                }}
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <UserCheck className="w-4 h-4 shrink-0" />
                )}
                <span>Submit Attendance</span>
              </button>
            </form>
          )}

          {/* SCAN RESULT BANNER (COMPACT) */}
          {scanResult && (
            <div className="px-5 pb-3 w-full shrink-0" style={{ boxSizing: "border-box" }}>
              <div
                className={`p-2.5 rounded-xl border transition-all animate-in fade-in duration-200 ${
                  scanResult.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : scanResult.type === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : "bg-red-50 border-red-200 text-red-950"
                }`}
                style={{ boxSizing: "border-box" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {scanResult.type === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {scanResult.type === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    {scanResult.type === "error" && (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold truncate shrink-0">
                      {scanResult.title}:
                    </span>
                    <span className="text-xs truncate text-neutral-700">
                      {scanResult.student?.name
                        ? `${scanResult.student.name} (Roll #${scanResult.student.rollNo || "—"})`
                        : scanResult.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {scanResult.record?.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          scanResult.record.status === "Present"
                            ? "bg-emerald-200/80 text-emerald-900"
                            : scanResult.record.status === "Late"
                              ? "bg-amber-200/80 text-amber-900"
                              : "bg-blue-200/80 text-blue-900"
                        }`}
                      >
                        {scanResult.record.status}
                      </span>
                    )}
                    {scanResult.type === "warning" && scanResult.rawCode && (
                      <button
                        type="button"
                        onClick={() =>
                          submitAttendance(scanResult.rawCode, {
                            override: true,
                          })
                        }
                        disabled={isProcessing}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        Update Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div
          className="w-full bg-neutral-50/80 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between shrink-0"
          style={{ padding: "12px 20px", gap: "10px", boxSizing: "border-box" }}
        >
          <p className="text-[11px] text-neutral-500 leading-snug m-0 flex-1">
            Point student card QR code directly at the camera. Records are
            automatically saved and synchronized with database reports.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0 cursor-pointer"
            style={{ height: "34px", padding: "0 16px", boxSizing: "border-box" }}
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
}
