import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  ShieldCheck,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  Barcode,
  Search,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowLeft,
  RotateCw,
  Camera,
  CameraOff,
  UserCheck,
  TrendingUp,
  Usb,
  Zap,
  Check,
  RefreshCw,
  Radio,
  Sparkles,
  X,
  CornerDownLeft,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./GateAttendanceKiosk.css";

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
 * Play instant, crisp optical scanner capture beep (emulates hardware laser confirmation)
 */
function playScanCaptureBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.type = "sine";
    // Crisp high-frequency scanner chirp: 2400 Hz for 65ms
    osc.frequency.setValueAtTime(2400, now);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.start(now);
    osc.stop(now + 0.065);
  } catch {
    // AudioContext may be restricted before user gesture
  }
}

/**
 * Play synthetic Web Audio API feedback cue for rapid gate throughput
 */
function playGateChime(type = "success") {
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
      // Pleasant 2-tone chime: D5 (587.33Hz) -> A5 (880Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "late") {
      // 2-tone chime in minor third: G5 (783.99Hz) -> Bb5 (932.33Hz)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(932.33, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "warning") {
      // Double low alert beep (440Hz -> 349.23Hz)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Low buzz for rejected / error
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    }

    if (navigator.vibrate) {
      if (type === "success") navigator.vibrate(60);
      else if (type === "late") navigator.vibrate([60, 40, 60]);
      else if (type === "warning") navigator.vibrate([40, 60, 40]);
      else navigator.vibrate(140);
    }
  } catch {
    // audio context may require user interaction
  }
}

export default function GateAttendanceKiosk() {
  const navigate = useNavigate();

  // Kiosk & System State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cutoffTime, setCutoffTime] = useState("08:15"); // Gate Cutoff Time (08:15 AM)
  const [scanMode, setScanMode] = useState("usb"); // "usb" | "camera" | "manual" (Default to USB scanner)

  // Live Stats State
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    totalScannedToday: 0,
    onTimeCount: 0,
    lateCount: 0,
    gateKioskCount: 0,
    coverageRate: 0,
    recentScans: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Scanner Hardware State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [isProcessing, setIsProcessing] = useState(false);

  // USB / Hardware Scanner State & WebHID Detection
  const [hidDevice, setHidDevice] = useState(null);
  const [hidSupported, setHidSupported] = useState(false);
  const [scannerSignal, setScannerSignal] = useState({
    active: true,
    lastTime: null,
    totalScans: 0,
  });
  const [scanAcknowledgment, setScanAcknowledgment] = useState(null); // { code, timestamp }

  // Manual Roll Input State
  const [manualInput, setManualInput] = useState("");

  // Refs for synchronous keystroke accumulation (Hardware Barcode Guns / Desktop Scanners)
  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScanCodeRef = useRef("");
  const feedbackTimerRef = useRef(null);
  const ackTimerRef = useRef(null);

  // Hero Feedback State
  const [heroFeedback, setHeroFeedback] = useState(null);

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebHID Detection & USB Connection Observer
  useEffect(() => {
    if (typeof navigator !== "undefined" && "hid" in navigator) {
      setHidSupported(true);

      // Check if scanner was already granted permission
      navigator.hid
        .getDevices()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setHidDevice(devices[0]);
          }
        })
        .catch(() => {});

      const onConnect = (e) => {
        if (e.device) {
          setHidDevice(e.device);
          toast.success(`Scanner Connected: ${e.device.productName || "USB Device"}`);
        }
      };

      const onDisconnect = (e) => {
        setHidDevice((prev) => (prev === e.device ? null : prev));
        toast("Scanner Disconnected", { icon: "🔌" });
      };

      navigator.hid.addEventListener("connect", onConnect);
      navigator.hid.addEventListener("disconnect", onDisconnect);
      return () => {
        navigator.hid.removeEventListener("connect", onConnect);
        navigator.hid.removeEventListener("disconnect", onDisconnect);
      };
    }
  }, []);

  // Fetch Gate Kiosk Live Morning Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/campus-admin/attendance/gate-kiosk-stats");
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch {
      // non-fatal background poll
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Show Hero Feedback Card
  const triggerFeedback = useCallback((result) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setHeroFeedback(result);
    feedbackTimerRef.current = setTimeout(() => {
      setHeroFeedback(null);
    }, 6000);
  }, []);

  // Core Gate Check-In Processor
  const processGateScan = useCallback(
    async (payload) => {
      const cleanPayload = typeof payload === "string" ? repairPayload(payload.trim()) : payload;
      if (!cleanPayload || isProcessing) return;

      // Debounce identical scans within 1.5s to prevent hardware gun duplicate bursts
      const nowTs = Date.now();
      if (lastScanCodeRef.current === cleanPayload && nowTs - lastScanTimeRef.current < 1500) {
        return;
      }
      lastScanTimeRef.current = nowTs;
      lastScanCodeRef.current = cleanPayload;

      setIsProcessing(true);

      try {
        const response = await axiosInstance.post("/campus-admin/attendance/qr-scan", {
          qrPayload: cleanPayload,
          method: "gate_kiosk",
          cutoffTime,
        });

        const data = response.data;

        if (data.success) {
          const student = data.student || {};
          const record = data.record || {};
          const isLate = record.status === "Late" || record.isLateArrival;
          const isAlready = data.alreadyMarked;

          let feedbackType = "present";
          if (isAlready) feedbackType = "warning";
          else if (isLate) feedbackType = "late";

          // Play Attendance Record Audio Chime
          if (soundEnabled) {
            playGateChime(feedbackType === "late" ? "late" : feedbackType === "warning" ? "warning" : "success");
          }

          triggerFeedback({
            type: feedbackType,
            title: isAlready
              ? "Already Checked In Today"
              : isLate
              ? "Late Arrival Recorded"
              : "Welcome! Checked In",
            message: data.message,
            student,
            record,
            entryTime:
              record.entryTime ||
              new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
          });

          // Refresh live feed
          fetchStats();
        }
      } catch (err) {
        if (soundEnabled) playGateChime("error");

        const resData = err.response?.data || {};
        const msg = resData.message || err.message || "Unrecognized student or invalid card.";
        const code = resData.code || "SCAN_ERROR";

        triggerFeedback({
          type: "error",
          title: "Check-In Rejected",
          message: msg,
          code,
          student: null,
          record: null,
        });
      } finally {
        setTimeout(() => {
          setIsProcessing(false);
          setScanAcknowledgment(null);
        }, 1200); // 1.2s cooldown to prevent double-scan
      }
    },
    [isProcessing, cutoffTime, soundEnabled, triggerFeedback, fetchStats]
  );

  /**
   * Handle Instant Hardware Scan Arrival
   * 1. Plays crisp optical scanner capture beep
   * 2. Shows immediate visual acknowledgment on frontend
   * 3. Dispatches attendance verification with backend
   */
  const handleHardwareScanCaptured = useCallback(
    (code) => {
      const trimmed = repairPayload((code || "").trim());
      if (!trimmed) return;

      // 1. Instant Hardware Scanner Beep
      if (soundEnabled) {
        playScanCaptureBeep();
      }

      // 2. Instant Visual Acknowledgment Banner
      const nowStr = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setScanAcknowledgment({
        code: trimmed,
        timestamp: nowStr,
      });

      if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
      ackTimerRef.current = setTimeout(() => {
        setScanAcknowledgment(null);
      }, 5000);

      // 3. Update Hardware Activity Signals
      setScannerSignal((prev) => ({
        active: true,
        lastTime: nowStr,
        totalScans: prev.totalScans + 1,
      }));

      // 4. Submit to Gate Attendance Engine
      processGateScan(trimmed);
    },
    [soundEnabled, processGateScan]
  );

  // Global Hardware Scanner Keystroke Listener (Captures scans across all kiosk modes)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not intercept if actively typing inside manual text boxes
      const isManual =
        e.target?.id === "gk-manual-input" ||
        e.target?.id === "gk-cutoff";

      if (isManual) return;

      if (e.key === "Enter" || e.key === "Tab") {
        const buffered = scanBufferRef.current.trim();
        if (buffered.length > 0) {
          e.preventDefault();
          scanBufferRef.current = "";
          if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
          handleHardwareScanCaptured(buffered);
        }
        return;
      }

      if (e.key.length === 1) {
        // Accumulate character synchronously in ref
        scanBufferRef.current += e.key;

        // Fallback auto-submit timeout for scanners that don't transmit an Enter suffix
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          const current = scanBufferRef.current.trim();
          if (
            current.length >= 8 &&
            (current.includes("EduHub") ||
              current.includes("{") ||
              current.includes("STUDENT") ||
              current.includes("studentId") ||
              current.includes(":"))
          ) {
            scanBufferRef.current = "";
            handleHardwareScanCaptured(current);
          }
        }, 1200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [handleHardwareScanCaptured]);

  // Keep background input ready for keyboard emulation
  useEffect(() => {
    if (scanMode === "usb" && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [scanMode]);

  // WebHID Explicit Pair Handler
  const handleRequestUsbPair = async () => {
    try {
      if (!navigator.hid) {
        toast.error("WebHID is not supported on this browser.");
        return;
      }
      const devices = await navigator.hid.requestDevice({ filters: [] });
      if (devices && devices.length > 0) {
        setHidDevice(devices[0]);
        toast.success(`Paired: ${devices[0].productName || "USB Scanner"}`);
      }
    } catch {
      // user closed prompt
    }
  };

  // Camera Scanner Setup via Html5Qrcode
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = "gate-kiosk-reader";

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          handleHardwareScanCaptured(decodedText);
        },
        () => {
          // parse error per frame - ignore
        }
      );

      setCameraActive(true);
    } catch (err) {
      setCameraActive(false);
      setCameraError(
        err?.message || "Camera access was denied or device is not available."
      );
    }
  }, [facingMode, handleHardwareScanCaptured]);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (scanMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, facingMode, startCamera, stopCamera]);

  // Manual Check-In Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error("Please enter a student roll number or name.");
      return;
    }
    handleHardwareScanCaptured(manualInput.trim());
    setManualInput("");
  };

  const formattedTimeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDateStr = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`gate-kiosk-page ${isFullscreen ? "is-fullscreen" : ""}`}>
      {/* ══════════════════════════════════════════════
          1. TOP BANNER HEADER
      ══════════════════════════════════════════════ */}
      <header className="gk-header">
        <div className="gk-header-left">
          <div className="gk-brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="gk-title-group">
            <h1>
              <span>School Gate Attendance Kiosk</span>
              <span className="gk-badge-pulse">
                <span className="gk-pulse-dot" />
                <span>LIVE GATE</span>
              </span>
            </h1>
            <p>Global student entrance scanner &amp; punctuality tracker</p>
          </div>
        </div>

        <div className="gk-header-controls">
          {/* Top row / primary indicators on mobile, inline on desktop */}
          <div className="gk-header-toprow">
            {/* Hardware Connection Status Pill */}
            <div
              className={`gk-hardware-pill ${
                hidDevice || scannerSignal.lastTime ? "is-connected" : "is-listening"
              }`}
              title="Desktop / Gun Scanner Hardware Status"
            >
              <span className="gk-hardware-dot" />
              <Usb size={13} className="shrink-0" />
              <span className="gk-hardware-text">
                {hidDevice
                  ? hidDevice.productName || "USB Scanner Connected"
                  : scannerSignal.lastTime
                  ? `Scanner Active (${scannerSignal.lastTime})`
                  : "Scanner Ready & Listening"}
              </span>
            </div>

            {/* Live Clock Card */}
            <div className="gk-clock-card">
              <span className="gk-clock-time">{formattedTimeStr}</span>
              <span className="gk-clock-date">{formattedDateStr}</span>
            </div>
          </div>

          {/* Actions row: Cutoff, audio, fullscreen, exit */}
          <div className="gk-header-actions">
            {/* Gate Cutoff Selector */}
            <div className="gk-cutoff-selector" title="Arrivals after this time are marked Late">
              <Clock size={14} className="text-amber-500 shrink-0" />
              <label htmlFor="gk-cutoff">Cutoff:</label>
              <input
                id="gk-cutoff"
                type="time"
                className="gk-cutoff-input"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
              />
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              className="gk-btn-icon"
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={soundEnabled ? "Mute audio cues" : "Enable audio cues"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="gk-btn-icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit full screen" : "Enter full screen kiosk mode"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Exit / Return */}
            <button
              type="button"
              className="gk-btn-exit"
              onClick={() => navigate("/student-attendance")}
              title="Return to Student Attendance Table"
            >
              <ArrowLeft size={14} className="shrink-0" />
              <span className="gk-btn-exit-full">Attendance Table</span>
              <span className="gk-btn-exit-short">Table</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          2. TOP KPI TRACK
      ══════════════════════════════════════════════ */}
      <div className="gk-kpi-row">
        <div className="gk-kpi-card">
          <div className="gk-kpi-icon blue">
            <Users size={18} />
          </div>
          <div className="gk-kpi-content">
            <span className="gk-kpi-val">{stats.totalEnrolled || 0}</span>
            <span className="gk-kpi-label">Enrolled Students</span>
          </div>
        </div>

        <div className="gk-kpi-card">
          <div className="gk-kpi-icon green">
            <CheckCircle2 size={18} />
          </div>
          <div className="gk-kpi-content">
            <span className="gk-kpi-val">
              {stats.totalScannedToday || 0}{" "}
              <small className="text-xs font-normal text-slate-500">
                ({stats.coverageRate || 0}%)
              </small>
            </span>
            <span className="gk-kpi-label">Checked In Today</span>
          </div>
        </div>

        <div className="gk-kpi-card">
          <div className="gk-kpi-icon green">
            <UserCheck size={18} />
          </div>
          <div className="gk-kpi-content">
            <span className="gk-kpi-val">{stats.onTimeCount || 0}</span>
            <span className="gk-kpi-label">On-Time Arrivals</span>
          </div>
        </div>

        <div className="gk-kpi-card">
          <div className="gk-kpi-icon amber">
            <AlertTriangle size={18} />
          </div>
          <div className="gk-kpi-content">
            <span className="gk-kpi-val">{stats.lateCount || 0}</span>
            <span className="gk-kpi-label">
              Late Arrivals <span className="gk-cutoff-sub">(&gt; {cutoffTime})</span>
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          3. MAIN INTERACTIVE GRID
      ══════════════════════════════════════════════ */}
      <div className="gk-main-grid">
        {/* Left Pane: Scanner & Check-In */}
        <div className="gk-scanner-pane">
          <div className="gk-card">
            {/* Mode Selector Tabs */}
            <div className="gk-mode-tabs">
              <button
                type="button"
                className={`gk-mode-btn ${scanMode === "usb" ? "active" : ""}`}
                onClick={() => setScanMode("usb")}
              >
                <Barcode size={15} className="shrink-0" />
                <span className="gk-tab-label-full">USB / Desktop Scanner</span>
                <span className="gk-tab-label-mid">USB Scanner</span>
                <span className="gk-tab-label-short">USB</span>
              </button>
              <button
                type="button"
                className={`gk-mode-btn ${scanMode === "camera" ? "active" : ""}`}
                onClick={() => setScanMode("camera")}
              >
                <Camera size={15} className="shrink-0" />
                <span className="gk-tab-label-full">Camera QR Scanner</span>
                <span className="gk-tab-label-mid">Camera QR</span>
                <span className="gk-tab-label-short">Camera</span>
              </button>
              <button
                type="button"
                className={`gk-mode-btn ${scanMode === "manual" ? "active" : ""}`}
                onClick={() => setScanMode("manual")}
              >
                <Search size={15} className="shrink-0" />
                <span className="gk-tab-label-full">Manual Roll Search</span>
                <span className="gk-tab-label-mid">Manual Roll</span>
                <span className="gk-tab-label-short">Manual</span>
              </button>
            </div>

            {/* Mode 1: Automated USB / Desktop Optical Scanner Target (Hands-Free HUD) */}
            {scanMode === "usb" && (
              <div className="gk-scanner-hud">
                {/* Background keystroke catcher for maximum browser & OS compatibility */}
                <input
                  ref={hiddenInputRef}
                  type="text"
                  className="gk-hidden-input"
                  aria-hidden="true"
                  tabIndex={-1}
                  readOnly
                />

                <div className="gk-hud-visualizer">
                  <div className="gk-reticle-ring">
                    <div className="gk-reticle-laser" />
                    <div className="gk-reticle-crosshair-h" />
                    <div className="gk-reticle-crosshair-v" />
                    <div className="gk-reticle-center">
                      <Barcode size={44} className="text-blue-500" />
                    </div>
                  </div>
                  <div className="gk-hud-status-badge">
                    <span className="gk-pulse-dot" />
                    <span>AUTOMATIC SCANNER LISTENING</span>
                  </div>
                </div>

                <div className="gk-hud-details">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3>Desktop &amp; Gun Scanner Active</h3>
                      <p>
                        Present student ID cards, QR badges, or mobile screens in front of the scanner window.
                        Attendance is recorded automatically with synthetic audio confirmation.
                      </p>
                    </div>
                    {hidSupported && (
                      <button
                        type="button"
                        className="gk-pair-btn"
                        onClick={handleRequestUsbPair}
                        title="Explicitly pair scanner via WebHID to display hardware product name"
                      >
                        <Usb size={14} />
                        <span>{hidDevice ? hidDevice.productName || "Paired USB" : "Pair WebHID"}</span>
                      </button>
                    )}
                  </div>

                  <div className="gk-hud-badges">
                    <span className="gk-hud-pill">
                      <Check size={12} className="text-emerald-500" /> Windows 10/11 &amp; Linux Compatible
                    </span>
                    <span className="gk-hud-pill">
                      <Zap size={12} className="text-amber-500" /> Instant Buffer &amp; Audio Beep
                    </span>
                    <span className="gk-hud-pill">
                      <Clock size={12} className="text-blue-500" /> Cutoff Threshold: {cutoffTime} AM
                    </span>
                    {scannerSignal.totalScans > 0 && (
                      <span className="gk-hud-pill text-slate-500">
                        Total scans today: <strong>{scannerSignal.totalScans}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Camera Scanner */}
            {scanMode === "camera" && (
              <div className="gk-camera-section">
                <div className="gk-camera-viewport">
                  <div
                    id={scannerContainerId}
                    className="gk-camera-stream"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      display: cameraActive ? "block" : "none",
                    }}
                  />
                  {cameraActive && (
                    <div className="gk-scanner-overlay">
                      <div className="gk-scan-target" />
                      <span className="gk-scan-instruction">
                        Position student card QR inside frame
                      </span>
                    </div>
                  )}
                  {!cameraActive && (
                    <div className="gk-camera-fallback">
                      <div className="gk-camera-fallback-icon-wrap">
                        <CameraOff size={32} className="gk-camera-fallback-icon" />
                      </div>
                      <p className="gk-camera-fallback-msg">
                        {cameraError || "Camera stream unavailable or permission needed."}
                      </p>
                      <button
                        type="button"
                        className="gk-camera-retry-btn"
                        onClick={startCamera}
                        title="Retry camera initialization"
                      >
                        <RotateCw size={13} />
                        <span>Retry Camera</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="gk-camera-controls-bar">
                  <span className="gk-camera-status-pill">
                    <span
                      className={`gk-camera-status-dot ${
                        cameraActive ? "is-active" : "is-standby"
                      }`}
                    />
                    <span>{cameraActive ? "Continuous Scanning Active" : "Camera Standby"}</span>
                  </span>
                  <button
                    type="button"
                    className="gk-camera-flip-btn"
                    onClick={() =>
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                    }
                    title="Switch front/back camera"
                  >
                    <RotateCw size={12} />
                    <span>Flip Camera</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Manual Roll Number Search */}
            {scanMode === "manual" && (
              <div className="gk-manual-panel">
                {/* Hero Header */}
                <div className="gk-manual-header">
                  <div className="gk-manual-icon-wrap">
                    <UserCheck size={20} />
                  </div>
                  <div className="gk-manual-title-block">
                    <h3>Manual Student Gate Check-In</h3>
                    <p>Direct entry verification for students with forgotten or damaged ID cards</p>
                  </div>
                </div>

                {/* Form Group */}
                <form onSubmit={handleManualSubmit} className="gk-manual-form">
                  <div className="gk-manual-input-wrapper">
                    <Search size={18} className="gk-manual-search-icon" />
                    <input
                      id="gk-manual-input"
                      type="text"
                      className="gk-manual-input-field"
                      placeholder="Enter student roll number or full name..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      autoFocus
                    />
                    {manualInput && (
                      <button
                        type="button"
                        className="gk-manual-clear-btn"
                        onClick={() => setManualInput("")}
                        title="Clear input"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="gk-manual-action-btn"
                    disabled={!manualInput.trim()}
                  >
                    <CheckCircle2 size={16} />
                    <span>Check In</span>
                  </button>
                </form>

                {/* Helper / Quick Tips Strip */}
                <div className="gk-manual-hints-strip">
                  <span className="gk-hint-tag">
                    <span className="gk-hint-dot" />
                    <span>Roll No. (e.g. <code>2</code>, <code>101</code>)</span>
                  </span>
                  <span className="gk-hint-tag">
                    <span className="gk-hint-dot" />
                    <span>Student Name</span>
                  </span>
                  <span className="gk-hint-tag gk-hint-key">
                    <CornerDownLeft size={11} />
                    <span>Press Enter to Submit</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Instant Scan Acknowledgment Banner (Optical Capture Acknowledgment) */}
          {scanAcknowledgment && (
            <div className="gk-acknowledgment-banner">
              <div className="gk-ack-icon">
                <Zap size={18} className="text-amber-500 animate-bounce" />
              </div>
              <div className="gk-ack-content">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">Scan Detected &amp; Acknowledged</span>
                  <span className="text-[11px] text-slate-500">{scanAcknowledgment.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 truncate font-mono">
                  Payload: {scanAcknowledgment.code.slice(0, 50)}
                  {scanAcknowledgment.code.length > 50 ? "..." : ""}
                </p>
              </div>
              <div className="gk-ack-status">
                <span className="gk-ack-pill">Validating...</span>
              </div>
            </div>
          )}

          {/* Hero Feedback Card: ONLY Display Reason for Failure on Error, or Student Profile on Success */}
          {heroFeedback && (
            heroFeedback.type === "error" ? (
              <div className="gk-hero-feedback status-error">
                <div className="gk-hero-error-banner">
                  <div className="gk-hero-error-icon">
                    <XCircle size={36} className="text-rose-500 animate-pulse" />
                  </div>
                  <div className="gk-hero-error-details">
                    <div className="flex items-center gap-2">
                      <span className="gk-status-badge-lg error">
                        <XCircle size={15} />
                        <span>{heroFeedback.title || "Check-In Rejected"}</span>
                      </span>
                      {heroFeedback.code && (
                        <span className="gk-error-code-badge font-mono">
                          [{heroFeedback.code}]
                        </span>
                      )}
                    </div>
                    <h3 className="gk-error-reason-title">
                      {heroFeedback.message || "Unrecognized student QR code or invalid card."}
                    </h3>
                    <p className="gk-error-advice">
                      {heroFeedback.code === "STUDENT_NOT_FOUND" &&
                        "The scanned card does not match any enrolled student in this campus. Please verify the QR card."}
                      {heroFeedback.code === "CAMPUS_MISMATCH" &&
                        "This student is registered at another campus and cannot mark attendance here."}
                      {heroFeedback.code === "STUDENT_INELIGIBLE" &&
                        "This student's enrollment status is inactive or suspended. Please contact the campus administration."}
                      {heroFeedback.code === "CLASS_MISMATCH" &&
                        "Student belongs to another class than the active session."}
                      {(!heroFeedback.code || heroFeedback.code === "SCAN_ERROR" || heroFeedback.code === "INVALID_QR_PAYLOAD") &&
                        "Hold the student ID card flat and steady in front of the scanner to re-attempt."}
                    </p>
                  </div>
                </div>
                <div className="gk-hero-error-actions">
                  <button
                    type="button"
                    className="gk-hero-dismiss-btn"
                    onClick={() => setHeroFeedback(null)}
                    title="Dismiss alert"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className={`gk-hero-feedback status-${heroFeedback.type}`}>
                <div className="gk-hero-student-meta">
                  {heroFeedback.student?.avatar ? (
                    <img
                      src={heroFeedback.student.avatar}
                      alt={heroFeedback.student.name}
                      className="gk-hero-avatar"
                    />
                  ) : (
                    <div className="gk-hero-avatar">
                      {(heroFeedback.student?.name || "S").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="gk-hero-info">
                    <h2>{heroFeedback.student?.name || "Student"}</h2>
                    <div className="gk-hero-class-chips">
                      <span className="gk-chip">
                        Roll #{heroFeedback.student?.rollNo || "—"}
                      </span>
                      <span className="gk-chip">
                        {heroFeedback.student?.className || "Class"}
                      </span>
                      <span className="gk-chip">
                        Section {heroFeedback.student?.section || "A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="gk-hero-status-box">
                  <span className={`gk-status-badge-lg ${heroFeedback.type}`}>
                    {heroFeedback.type === "present" && <CheckCircle2 size={16} />}
                    {heroFeedback.type === "late" && <AlertTriangle size={16} />}
                    {heroFeedback.type === "warning" && <UserCheck size={16} />}
                    <span>{heroFeedback.title}</span>
                  </span>
                  <span className="gk-hero-time">
                    Time: {heroFeedback.entryTime}
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Pane: Live Morning Influx Feed */}
        <div className="gk-feed-pane">
          <div className="gk-feed-header">
            <h3>
              <TrendingUp size={16} className="text-blue-500" />
              <span>Today's Gate Influx</span>
            </h3>
            <span className="gk-feed-count">
              {stats.recentScans?.length || 0} arrivals
            </span>
          </div>

          <div className="gk-feed-list">
            {(!stats.recentScans || stats.recentScans.length === 0) ? (
              <div className="gk-feed-empty">
                <div className="gk-feed-empty-icon">
                  <Users size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No arrivals recorded yet</p>
                <p className="text-xs">
                  Students scanned at the gate will appear here in real time.
                </p>
              </div>
            ) : (
              stats.recentScans.map((item) => {
                const isLate = item.status === "Late" || item.isLateArrival;
                return (
                  <div key={item.id} className="gk-feed-item">
                    <div className="gk-feed-student">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="gk-feed-avatar"
                        />
                      ) : (
                        <div className="gk-feed-avatar">
                          {(item.name || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="gk-feed-meta">
                        <span className="gk-feed-name">{item.name}</span>
                        <span className="gk-feed-sub">
                          Roll #{item.rollNo} • {item.className} ({item.section})
                        </span>
                      </div>
                    </div>

                    <div className="gk-feed-badge-wrap">
                      <span
                        className={`gk-status-tag ${
                          isLate ? "late" : "present"
                        }`}
                      >
                        {isLate ? "Late" : "Present"}
                      </span>
                      <span className="gk-feed-time">
                        {item.entryTime || "Today"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
