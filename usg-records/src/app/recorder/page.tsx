"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Delete,
  Upload,
  Power,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import axios from "axios";

type AppState = "ready" | "starting" | "recording" | "uploading";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("ready");
  const [patientId, setPatientId] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  // Timestamp of last local typing to prevent polling race conditions
  const lastLocalEditRef = useRef<number>(0);
  // Timestamp of last handled server diagnostic error
  const lastHandledErrorTimestamp = useRef<number>(0);

  // Diagnostic Error Toast state
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorTime, setErrorTime] = useState<string | null>(null);
  const [isToastMinimized, setIsToastMinimized] = useState(false);

  // Exit dialog state
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);

  const isRecording = appState === "recording";

  // Real-time synchronization with server & mobile remote app (500ms interval)
  useEffect(() => {
    let isSubscribed = true;

    const pollStatus = async () => {
      try {
        const res = await axios.get("/api/record/status");
        if (!isSubscribed) return;
        const data = res.data;
        if (!data) return;

        // 1. Synchronize Starting State triggered from mobile remote app
        if (data.isStarting || data.state === "starting") {
          setAppState("starting");
        } else if (data.isRecording) {
          // 2. Synchronize Active Recording
          setAppState("recording");
          if (data.patientId) {
            setPatientId(data.patientId);
          }
          if (typeof data.durationSeconds === "number") {
            setRecordingTime(data.durationSeconds);
          }
        } else {
          // 3. Kiosk is ready (idle)
          setAppState((prev) => (prev === "recording" || prev === "starting" ? "ready" : prev));

          // If in "ready" state and no local keystrokes in last 600ms, sync draft patientId from remote
          if (Date.now() - lastLocalEditRef.current > 600) {
            const serverDraft = typeof data.draftPatientId === "string" ? data.draftPatientId : "";
            setPatientId((prev) => (prev !== serverDraft ? serverDraft : prev));
          }
        }

        // 4. Synchronize Diagnostic Error Toast triggered from remote
        if (data.lastError && data.lastError.timestamp > lastHandledErrorTimestamp.current) {
          lastHandledErrorTimestamp.current = data.lastError.timestamp;
          triggerError(data.lastError.message, data.lastError.code);
          setAppState("ready");
        }
      } catch {
        // Silently tolerate transient local network glitches
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Local timer tick while in recording state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Floating Toast auto-collapse timer (collapses to AlertTriangle badge after 5 seconds)
  useEffect(() => {
    if (error && !isToastMinimized) {
      const timer = setTimeout(() => {
        setIsToastMinimized(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, isToastMinimized]);

  const triggerError = (msg: string, code?: string | null) => {
    setError(msg);
    setErrorCode(code || null);
    setErrorTime(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    setIsToastMinimized(false);
  };

  const dismissError = () => {
    setError(null);
    setErrorCode(null);
    setErrorTime(null);
    setIsToastMinimized(false);
  };

  const updateLocalPatientId = (newVal: string) => {
    lastLocalEditRef.current = Date.now();
    setPatientId(newVal);
    axios.post("/api/record/draft", { patientId: newVal }).catch(() => {});
  };

  const handleKeypadClick = (val: string) => {
    if (appState !== "ready") return;
    if (error) dismissError();
    if (patientId.length < 20) {
      updateLocalPatientId(patientId + val);
    }
  };

  const handleBackspace = () => {
    if (appState !== "ready") return;
    if (error) dismissError();
    updateLocalPatientId(patientId.slice(0, -1));
  };

  const handleClear = () => {
    if (appState !== "ready") return;
    if (error) dismissError();
    updateLocalPatientId("");
  };

  const startRecording = async () => {
    if (!patientId || appState !== "ready") return;
    dismissError();
    setAppState("starting");

    try {
      await axios.post("/api/record/start", { patientId });
      // FFmpeg confirmed active recording: reset timer to 0 and begin counting
      setRecordingTime(0);
      setAppState("recording");
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      const msg =
        err.response?.data?.error ||
        "Gagal memulai perekaman. Periksa koneksi capture card.";
      const code = err.response?.data?.code || null;
      triggerError(msg, code);
      setAppState("ready");
    }
  };

  const stopRecording = async () => {
    if (appState !== "recording") return;
    dismissError();
    setAppState("uploading");
    try {
      await axios.post("/api/record/stop");
      setPatientId("");
      setAppState("ready");
    } catch (err) {
      console.error("Failed to stop recording:", err);
      triggerError("Perekaman dihentikan, namun upload gagal. Cek koneksi.");
      setAppState("ready");
    }
  };

  const handleExitApp = async () => {
    setIsExiting(true);
    setExitError(null);
    try {
      await axios.post("/api/system/exit");
      window.close();
    } catch (err: any) {
      console.error("Failed to exit app:", err);
      setExitError(
        err.response?.data?.error || "Gagal menutup aplikasi. Silakan coba lagi."
      );
      setIsExiting(false);
    }
  };

  // Global physical keyboard listener with clinical safety rule
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Exit modal shortcuts
      if (showExitModal) {
        if (e.key === "Escape") {
          e.preventDefault();
          if (!isExiting) setShowExitModal(false);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (!isExiting) handleExitApp();
        }
        return;
      }

      // CRITICAL CLINICAL SAFETY RULE:
      // While recording is in progress, suppress ALL keyboard keys completely!
      // Stopping recording MUST be mouse/touch-only to prevent accidental disruption.
      if (appState === "recording") {
        return;
      }

      // If starting or uploading, ignore all keys
      if (appState !== "ready") {
        return;
      }

      // In "ready" state:
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (error) dismissError();
        if (patientId.length < 20) {
          updateLocalPatientId(patientId + e.key);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (error) dismissError();
        updateLocalPatientId(patientId.slice(0, -1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (error) dismissError();
        updateLocalPatientId("");
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (patientId.length > 0) {
          startRecording();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appState, patientId, showExitModal, error, isExiting]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <>
      {/* Floating Diagnostic Error Toast / Collapsed IT Support Badge */}
      {error && (
        isToastMinimized ? (
          <div
            className="toast-minimized"
            onClick={() => setIsToastMinimized(false)}
            title="Klik untuk melihat detail error (IT Support)"
          >
            <AlertTriangle size={18} className="pulse-warning" />
            <span>
              {errorCode ? errorCode.replace(/_/g, " ") : "Error"}
              {errorTime ? ` (${errorTime})` : ""}
            </span>
          </div>
        ) : (
          <div className="toast-floating">
            <AlertTriangle size={22} className="text-danger flex-shrink-0" />
            <div className="toast-content">
              <div className="toast-header-row">
                <span className="toast-title">
                  {errorCode ? `Diagnosa: ${errorCode.replace(/_/g, " ")}` : "Pemberitahuan Sistem"}
                </span>
                {errorTime && <span className="toast-time">{errorTime}</span>}
              </div>
              <p className="toast-message">{error}</p>
            </div>
            <button
              className="toast-close"
              onClick={dismissError}
              title="Tutup pesan error"
            >
              <X size={18} />
            </button>
          </div>
        )
      )}

      <div className="dashboard">
        {/* Left Panel */}
        <div className="panel">
          {appState === "ready" && (
            <>
              <h2 className="panel-title">Masukkan ID Pasien</h2>

              <div className="id-display">
                {patientId}
                <span className="cursor-blink"></span>
              </div>

              <div className="keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    className="keypad-btn"
                    onClick={() => handleKeypadClick(num.toString())}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="keypad-btn action-btn"
                  onClick={handleClear}
                  title="Hapus semua karakter (Esc)"
                >
                  <span>Hapus semua</span>
                  <span className="key-legend">Esc</span>
                </button>
                <button
                  className="keypad-btn"
                  onClick={() => handleKeypadClick("0")}
                >
                  0
                </button>
                <button
                  className="keypad-btn action-btn"
                  onClick={handleBackspace}
                  title="Hapus digit terakhir (Backspace)"
                >
                  <Delete size={22} />
                  <span className="key-legend">Backspace</span>
                </button>
              </div>
            </>
          )}

          {(appState === "starting" || appState === "recording") && (
            <div className="recording-info">
              <div className="patient-badge">
                <User size={32} className="text-slate-400" />
                <span>ID Pasien: {patientId}</span>
              </div>

              <div className="flex flex-col items-center">
                {appState === "starting" ? (
                  <div className="starting-status">
                    <div className="starting-dot"></div>
                    <span>Menyiapkan perekaman...</span>
                  </div>
                ) : (
                  <div className="recording-status">
                    <div className="recording-dot"></div>
                    <span>Sedang merekam</span>
                  </div>
                )}
                <div
                  className={`recording-timer ${
                    appState === "starting" ? "muted" : ""
                  }`}
                >
                  {formatTime(recordingTime)}
                </div>
              </div>
            </div>
          )}

          {appState === "uploading" && (
            <div className="recording-info">
              <div className="patient-badge">
                <User size={32} className="text-slate-400" />
                <span>ID Pasien: {patientId}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="uploading-status">
                  <Upload size={24} className="upload-icon" />
                  <span>Mengunggah rekaman...</span>
                </div>
                <div className="recording-timer muted">{formatTime(recordingTime)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="panel">
          <div className="huge-btn-container">
            {appState === "ready" && (
              <button
                className="huge-btn start"
                onClick={startRecording}
                disabled={!patientId}
                title={patientId ? "Mulai Perekaman (Enter)" : "Ketik ID Pasien terlebih dahulu"}
              >
                <span>MULAI REKAM</span>
                <span className="huge-btn-legend">Tekan Enter ↵</span>
              </button>
            )}
            {appState === "starting" && (
              <button className="huge-btn starting" disabled>
                MENYIAPKAN...
              </button>
            )}
            {appState === "recording" && (
              <button
                className="huge-btn stop"
                onClick={stopRecording}
                title="Klik untuk menghentikan rekaman (Mouse Only)"
              >
                STOP
              </button>
            )}
            {appState === "uploading" && (
              <button className="huge-btn uploading" disabled>
                UPLOADING...
              </button>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-left">Sistem perekaman USG</div>
        <div className="footer-center">
          Gunakan layar sentuh atau keyboard fisik untuk mengoperasikan sistem
        </div>
        <div className="footer-right">
          <button
            className="exit-btn"
            onClick={() => setShowExitModal(true)}
            disabled={
              appState === "recording" ||
              appState === "starting" ||
              appState === "uploading"
            }
            title="Tutup Aplikasi"
          >
            <Power size={20} className="exit-icon" />
            <span>Tutup Aplikasi</span>
          </button>
        </div>
      </footer>

      {/* Confirmation Dialog for Exiting */}
      {showExitModal && (
        <div
          className="modal-overlay"
          onClick={() => !isExiting && setShowExitModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Tutup Aplikasi?</h3>
            <p className="modal-desc">
              Aplikasi perekaman akan ditutup sepenuhnya. Anda dapat
              mematikan laptop setelah aplikasi ditutup.
            </p>

            {exitError && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{exitError}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowExitModal(false)}
                disabled={isExiting}
              >
                Batal (Esc)
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleExitApp}
                disabled={isExiting}
              >
                <Power size={18} />
                <span>{isExiting ? "Menutup..." : "Ya (Enter)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
