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
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./GateAttendanceKiosk.css";

/**
 * Auto-repair payload if hardware scanner dropped leading/trailing braces
 */
function repairPayload(raw) {
  if (!raw || typeof raw !== "string") return raw;
  let str = raw.trim();
  if (!str.startsWith("{") && (str.includes('"app"') || str.includes('"studentId"'))) {
    str = "{" + str;
  }
  if (str.startsWith("{") && !str.endsWith("}")) {
    str = str + "}";
  }
  // Auto-normalize corrupted type strings caused by HID scanner shift/numlock quirks
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
  const [usbInputValue, setUsbInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [scanAcknowledgment, setScanAcknowledgment] = useState(null); // { code, timestamp }

  // Manual Roll Input State
  const [manualInput, setManualInput] = useState("");

  // Refs for synchronous keystroke accumulation (Hardware Barcode Guns / Desktop Scanners)
  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);
  const usbInputRef = useRef(null);
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

        const msg = err.response?.data?.message || err.message || "Unrecognized student or invalid card.";
        triggerFeedback({
          type: "error",
          title: "Check-In Failed",
          message: msg,
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
          setUsbInputValue("");
          if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
          handleHardwareScanCaptured(buffered);
        }
        return;
      }

      if (e.key.length === 1) {
        // Accumulate character synchronously in ref
        scanBufferRef.current += e.key;
        setUsbInputValue(scanBufferRef.current);

        // Fallback auto-submit timeout for scanners that don't transmit an Enter suffix
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          const current = scanBufferRef.current.trim();
          if (
            current.length >= 10 &&
            (current.includes("EduHub") || current.includes("{") || current.includes("STUDENT"))
          ) {
            scanBufferRef.current = "";
            setUsbInputValue("");
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

  // Auto-focus USB input when USB mode is active
  useEffect(() => {
    if (scanMode === "usb" && usbInputRef.current) {
      usbInputRef.current.focus();
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

  // Handle USB Console Input Submit
  const handleUsbInputSubmit = (e) => {
    e.preventDefault();
    if (!usbInputValue.trim()) {
      toast.error("Please scan an ID card or enter a payload.");
      return;
    }
    const val = usbInputValue.trim();
    setUsbInputValue("");
    scanBufferRef.current = "";
    handleHardwareScanCaptured(val);
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
          {/* Hardware Connection Status Pill */}
          <div
            className={`gk-hardware-pill ${
              hidDevice || scannerSignal.lastTime ? "is-connected" : "is-listening"
            }`}
            title="Desktop / Gun Scanner Hardware Status"
          >
            <span className="gk-hardware-dot" />
            <Usb size={13} />
            <span>
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
            <ArrowLeft size={14} />
            <span>Attendance Table</span>
          </button>
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
            <span className="gk-kpi-label">Late Arrivals (&gt; {cutoffTime})</span>
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
                <Barcode size={15} />
                <span>USB / Desktop Scanner</span>
              </button>
              <button
                type="button"
                className={`gk-mode-btn ${scanMode === "camera" ? "active" : ""}`}
                onClick={() => setScanMode("camera")}
              >
                <Camera size={15} />
                <span>Camera QR Scanner</span>
              </button>
              <button
                type="button"
                className={`gk-mode-btn ${scanMode === "manual" ? "active" : ""}`}
                onClick={() => setScanMode("manual")}
              >
                <Search size={15} />
                <span>Manual Roll Search</span>
              </button>
            </div>

            {/* Mode 1: USB Hardware Desktop / Gun Scanner */}
            {scanMode === "usb" && (
              <div className="gk-hardware-console">
                {/* Hardware Connection & Status Banner */}
                <div className="gk-hardware-hero">
                  <div className="gk-hardware-hero-icon">
                    <Barcode size={32} />
                  </div>
                  <div className="gk-hardware-hero-text">
                    <div className="flex items-center gap-2">
                      <h3>Desktop &amp; Gun Scanner Active</h3>
                      <span className="gk-signal-badge">
                        <span className="gk-pulse-dot" />
                        <span>Ready For Scans</span>
                      </span>
                    </div>
                    <p>
                      Present student QR cards, barcodes, or mobile screens in front of the red scanner window.
                      Attendance is recorded instantly with synthetic audio confirmation.
                    </p>
                  </div>
                  {hidSupported && (
                    <button
                      type="button"
                      className="gk-pair-btn"
                      onClick={handleRequestUsbPair}
                      title="Explicitly pair scanner via WebHID to display model name"
                    >
                      <Usb size={14} />
                      <span>{hidDevice ? "Re-pair USB" : "Pair WebHID"}</span>
                    </button>
                  )}
                </div>

                {/* Explicit Interactive Scanner Input Console */}
                <form onSubmit={handleUsbInputSubmit} className="gk-scanner-input-container">
                  <div className="gk-input-header">
                    <label htmlFor="gk-usb-hardware-input" className="gk-input-label">
                      <span>Scanner Input Stream &amp; Focus:</span>
                    </label>
                    <div className="gk-input-meta">
                      <span className={`gk-focus-pill ${isInputFocused ? "focused" : ""}`}>
                        {isInputFocused ? "● Scanner Focused" : "○ Click to Focus"}
                      </span>
                      {scannerSignal.totalScans > 0 && (
                        <span className="text-xs text-slate-500">
                          Scans today: <strong>{scannerSignal.totalScans}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="gk-input-wrapper">
                    <input
                      ref={usbInputRef}
                      id="gk-usb-hardware-input"
                      type="text"
                      className="gk-scanner-input"
                      placeholder="Flash ID Card or type student roll/code..."
                      value={usbInputValue}
                      onChange={(e) => {
                        setUsbInputValue(e.target.value);
                        scanBufferRef.current = e.target.value;
                      }}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      className="gk-refocus-btn"
                      onClick={() => usbInputRef.current?.focus()}
                      title="Keep cursor focused for maximum reliability"
                    >
                      Focus
                    </button>
                    <button
                      type="submit"
                      className="gk-scanner-submit-btn"
                      disabled={isProcessing || !usbInputValue.trim()}
                    >
                      <Check size={16} />
                      <span>Submit</span>
                    </button>
                  </div>

                  <div className="gk-scanner-hints">
                    <span>⚡ <strong>Hands-Free Auto-Capture:</strong> The scanner types and hits Enter automatically.</span>
                    <span>🔊 <strong>Sounds:</strong> Optical Beep on capture + Gate Chime on record.</span>
                  </div>
                </form>
              </div>
            )}

            {/* Mode 2: Camera Scanner */}
            {scanMode === "camera" && (
              <div>
                <div className="gk-camera-viewport">
                  <div id={scannerContainerId} style={{ width: "100%", height: "100%" }} />
                  {cameraActive && (
                    <div className="gk-scanner-overlay">
                      <div className="gk-scan-target" />
                      <span className="gk-scan-instruction">
                        Position student card QR inside frame
                      </span>
                    </div>
                  )}
                  {!cameraActive && (
                    <div className="text-center p-6 text-slate-400">
                      <CameraOff size={36} className="mx-auto mb-2 opacity-60" />
                      <p className="text-xs">{cameraError || "Initializing video stream..."}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Continuous Scanning Active
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    onClick={() =>
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                    }
                  >
                    <RotateCw size={12} />
                    <span>Flip Camera</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Manual Roll Number Search */}
            {scanMode === "manual" && (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Enter student Roll Number (e.g. <code>2</code> or <code>101</code>) or student Name for manual gate check-in:
                </p>
                <form onSubmit={handleManualSubmit} className="gk-manual-search-row">
                  <input
                    id="gk-manual-input"
                    type="text"
                    className="gk-manual-input"
                    placeholder="Enter student roll number or full name..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="gk-manual-submit-btn">
                    <CheckCircle2 size={16} />
                    <span>Check In</span>
                  </button>
                </form>
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

          {/* Hero Feedback Card (Full Student Profile & Attendance Result) */}
          {heroFeedback && (
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
                  {heroFeedback.type === "error" && <XCircle size={16} />}
                  <span>{heroFeedback.title}</span>
                </span>
                <span className="gk-hero-time">
                  Time: {heroFeedback.entryTime}
                </span>
              </div>
            </div>
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
