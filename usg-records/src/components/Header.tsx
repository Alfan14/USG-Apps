"use client";

import { useEffect, useState } from "react";
import { Clock, QrCode, Wifi, WifiOff } from "lucide-react";
import axios from "axios";

export default function Header() {
  const [time, setTime] = useState<Date | null>(null);

  // QR Code Pairing Modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    mode: "hotspot" | "lan";
    ip: string;
    serverUrl: string;
    qrDataUrl: string;
    hotspot: {
      configured: boolean;
      active: boolean;
      ssid: string | null;
      message: string | null;
    };
  } | null>(null);
  const [loadingNetwork, setLoadingNetwork] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const openQrModal = async () => {
    setShowQrModal(true);
    // Always refetch: the endpoint re-enables the hotspot if it was turned off
    setLoadingNetwork(true);
    try {
      const res = await axios.get("/api/system/network");
      setNetworkInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch network info:", err);
      setNetworkInfo(null);
    } finally {
      setLoadingNetwork(false);
    }
  };

  // Close QR modal on Escape key
  useEffect(() => {
    if (!showQrModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowQrModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQrModal]);

  const formattedDate = time
    ? time.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const formattedTime = time
    ? time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo-mock">D</div>
          <div className="header-title-wrapper">
            <h1 className="header-title">RS DARMAYU</h1>
            <div className="header-divider"></div>
            <span className="header-subtitle">Perekaman USG</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="qr-connect-btn"
            onClick={openQrModal}
            title="Hubungkan HP Remote Control via QR Code"
          >
            <QrCode size={18} className="qr-icon" />
            <span>Hubungkan HP</span>
          </button>

          <div className="header-clock">
            <Clock size={20} />
            <span suppressHydrationWarning>
              {time ? `${formattedDate} | ${formattedTime}` : "Memuat waktu..."}
            </span>
          </div>
        </div>
      </header>

      {/* QR Code Pairing Modal */}
      {showQrModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowQrModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Hubungkan HP Remote</h3>
            <p className="modal-desc">
              Pindai kode QR ini menggunakan aplikasi <strong>USG Remote</strong> di HP dokter/perawat untuk menghubungkan kontrol jarak jauh.
            </p>

            <div className="qr-modal-image-wrapper">
              {loadingNetwork ? (
                <div style={{ padding: "2rem", color: "#64748b" }}>Menyiapkan hotspot...</div>
              ) : networkInfo?.qrDataUrl ? (
                <img
                  src={networkInfo.qrDataUrl}
                  alt="QR Code Pairing"
                  width={220}
                  height={220}
                  style={{ display: "block" }}
                />
              ) : (
                <div style={{ padding: "2rem", color: "#ef4444" }}>Gagal memuat QR</div>
              )}
            </div>

            {!loadingNetwork && networkInfo && (
              <>
                {networkInfo.mode === "hotspot" ? (
                  <div className="qr-hotspot-badge ok">
                    <Wifi size={16} />
                    <span>Hotspot aktif: <strong>{networkInfo.hotspot.ssid}</strong></span>
                  </div>
                ) : (
                  <div className="qr-hotspot-badge warn">
                    <WifiOff size={16} />
                    <span>
                      {networkInfo.hotspot.configured
                        ? "Hotspot gagal aktif, memakai jaringan LAN/Wi-Fi RS."
                        : "Hotspot belum dikonfigurasi, memakai jaringan LAN/Wi-Fi RS."}
                    </span>
                  </div>
                )}
                <div className="qr-modal-url">{networkInfo.serverUrl}</div>
              </>
            )}

            <p className="qr-instructions">
              {networkInfo?.mode === "hotspot"
                ? "Cukup pindai sekali. HP akan otomatis tersambung ke hotspot laptop ini."
                : "Pastikan HP terhubung ke jaringan yang sama dengan laptop ini."}
            </p>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowQrModal(false)}
              >
                Tutup (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
