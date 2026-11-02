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
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./GateAttendanceKiosk.css";

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
      // Pleasant 2-tone chime: D5 -> A5
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === "late") {
      // 2-tone chime in minor third: G5 -> Bb5
      osc.type = "triangle";
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(932.33, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === "warning") {
      // Double low alert beep
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
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
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
  const [scanMode, setScanMode] = useState("camera"); // "camera" | "usb" | "manual"

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

  // Manual & USB Scanner Input State
  const [manualInput, setManualInput] = useState("");
  const [usbBuffer, setUsbBuffer] = useState("");
  const lastKeyTimeRef = useRef(Date.now());
  const usbInputRef = useRef(null);

  // Hero Feedback State
  const [heroFeedback, setHeroFeedback] = useState(null);
  const feedbackTimerRef = useRef(null);

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
      if (isProcessing || !payload) return;
      setIsProcessing(true);

      try {
        const response = await axiosInstance.post("/campus-admin/attendance/qr-scan", {
          qrPayload: payload,
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

          if (soundEnabled) {
            playGateChime(feedbackType === "late" ? "late" : feedbackType === "warning" ? "warning" : "success");
          }

          triggerFeedback({
            type: feedbackType,
            title: isAlready
              ? "Already Checked In"
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
        }, 1200); // 1.2s cooldown to prevent double-scan
      }
    },
    [isProcessing, cutoffTime, soundEnabled, triggerFeedback, fetchStats]
  );

  // USB Barcode Scanner Keyboard Listener
  useEffect(() => {
    if (scanMode !== "usb") return;

    const handleKeyDown = (e) => {
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (usbBuffer.trim().length > 0) {
          e.preventDefault();
          processGateScan(usbBuffer.trim());
          setUsbBuffer("");
        }
      } else if (e.key.length === 1) {
        // Fast keystrokes (< 50ms) are typical of hardware barcode guns
        if (diff > 120) {
          setUsbBuffer(e.key);
        } else {
          setUsbBuffer((prev) => prev + e.key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanMode, usbBuffer, processGateScan]);

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
          processGateScan(decodedText);
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
  }, [facingMode, processGateScan]);

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
    processGateScan(manualInput.trim());
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
                className={`gk-mode-btn ${scanMode === "camera" ? "active" : ""}`}
                onClick={() => setScanMode("camera")}
              >
                <Camera size={15} />
                <span>Camera QR Scanner</span>
              </button>
              <button
                type="button"
                className={`gk-mode-btn ${scanMode === "usb" ? "active" : ""}`}
                onClick={() => setScanMode("usb")}
              >
                <Barcode size={15} />
                <span>USB / Gun Scanner</span>
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

            {/* Mode 1: Camera Scanner */}
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

            {/* Mode 2: USB Hardware Scanner Gun */}
            {scanMode === "usb" && (
              <div className="gk-usb-panel">
                <div className="gk-usb-icon">
                  <Barcode size={28} />
                </div>
                <h3>Hardware Scanner Ready</h3>
                <p>
                  Flash any student QR or barcode card with your handheld scanner. Input is captured
                  automatically across turnstiles and gates.
                </p>
                {usbBuffer && (
                  <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-mono">
                    Buffer: {usbBuffer}
                  </div>
                )}
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

          {/* Hero Feedback Card */}
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
