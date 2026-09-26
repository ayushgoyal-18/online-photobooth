import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Check, QrCode, X, Camera, Sparkles, Copy, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { trackEvent } from "../utils/analytics";
import { downloadImage } from "../utils/download";

export default function PhotostripView() {
  const { stripId } = useParams();
  const navigate = useNavigate();
  const [strip, setStrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [lanIp, setLanIp] = useState("");
  const [copiedQr, setCopiedQr] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Keyboard Escape listener to close QR modal
  useEffect(() => {
    if (!showQr) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowQr(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQr]);

  const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "https://framoji-backend.onrender.com").replace(/\/+$/, "");

  // Prevent search engine indexing of shared private photostrips
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    let created = false;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
      created = true;
    }
    const prevContent = meta.content;
    meta.content = "noindex,nofollow";

    return () => {
      if (created && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta) {
        meta.content = prevContent;
      }
    };
  }, []);

  useEffect(() => {
    if (!stripId) {
      setError("Photostrip not found or link has expired.");
      trackEvent("photostrip_not_found", { reason: "missing_id" });
      setLoading(false);
      return;
    }

    const cleanStripId = stripId.trim();

    // 1. Try fetching from backend API
    fetch(`${SERVER_URL}/api/photostrips/${encodeURIComponent(cleanStripId)}`)
      .then((res) => {
        if (res.status === 404) throw new Error("NOT_FOUND");
        if (!res.ok) throw new Error("SERVER_ERROR");
        return res.json();
      })
      .then((data) => {
        setStrip(data);
        setLoading(false);
      })
      .catch((err) => {
        // 2. Fallback to localStorage gallery (for local testing)
        try {
          const gallery = JSON.parse(localStorage.getItem("framoji-gallery") || "[]");
          const found = gallery.find((g) => g.stripId === cleanStripId || g.id === cleanStripId);
          if (found) {
            setStrip(found);
            setLoading(false);
            return;
          }
        } catch (_) { }

        trackEvent("photostrip_not_found", { error: err.message });
        if (err.message === "SERVER_ERROR") {
          setError("Unable to reach the Framoji server. Please try refreshing in a moment.");
        } else {
          setError("Photostrip not found. The link may be invalid or expired.");
        }
        setLoading(false);
      });

    // Auto-fetch local machine LAN IP only in local development
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      fetch(`${SERVER_URL}/api/network-info`)
        .then(res => res.json())
        .then(data => {
          if (data?.localIp && data.localIp !== "localhost") {
            setLanIp(data.localIp);
          }
        })
        .catch(() => {});
    }
  }, [stripId, SERVER_URL]);

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const origin = isLocal && lanIp
    ? `http://${lanIp}:${window.location.port || "5173"}`
    : window.location.origin;
  const qrTargetUrl = `${origin}/strip/${stripId}`;

  useEffect(() => {
    if (qrTargetUrl) {
      QRCode.toDataURL(qrTargetUrl, { width: 180, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
        .then(setQrCodeDataUrl)
        .catch((err) => console.warn("[qrcode] generation failed:", err));
    }
  }, [qrTargetUrl]);

  const copyShareLink = async () => {
    trackEvent("share_clicked", { source: "photostrip_view", type: "copy_link" });
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      showToast("Clipboard access was denied.", "error");
    }
  };

  const shareNative = () => {
    trackEvent("share_clicked", { source: "photostrip_view", type: "native_share" });
    if (navigator.share) {
      navigator.share({
        title: `${strip?.names || "Photostrip"} on Framoji`,
        url: window.location.href,
      }).catch(() => { });
    } else {
      copyShareLink();
    }
  };

  const [downloading, setDownloading] = useState(false);

  const downloadPhotostrip = async () => {
    const targetUrl = strip?.cloudinaryUrl || strip?.dataUrl;
    if (!targetUrl || downloading) return;
    trackEvent("download_clicked", { source: "photostrip_view" });
    setDownloading(true);
    try {
      await downloadImage(targetUrl, `framoji-${stripId}.png`);
    } catch (err) {
      trackEvent("download_failed", { source: "photostrip_view" });
      showToast("Direct download is not supported in this browser. Opened in a new tab instead.", "warning");
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-sub)" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--violet-lt)", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }} />
          <p style={{ fontSize: 14 }}>Loading photostrip…</p>
        </div>
      </div>
    );
  }

  if (error || !strip) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎞️</div>
          <h2 className="display" style={{ fontSize: 24, color: "var(--cream)", marginBottom: 10 }}>Photostrip Not Found</h2>
          <p style={{ color: "var(--text-sub)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            {error || "This photostrip link is invalid or no longer exists."}
          </p>
          <button className="btn btn-primary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => navigate("/")}>
            Create your own booth
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = strip.cloudinaryUrl || strip.dataUrl;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }} className="aurora-bg">
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,8,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontWeight: 800, fontSize: 18, fontFamily: "DM Sans, sans-serif" }}>
          fra<span style={{ color: "var(--violet-lt)" }}>moji</span>
        </button>
        <button className="btn btn-primary" style={{ padding: "7px 18px", fontSize: 13 }} onClick={() => navigate("/create")}>
          <Camera size={13} /> Create booth
        </button>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", fontSize: 11, color: "var(--violet-lt)", fontWeight: 700, marginBottom: 12 }}>
            <Sparkles size={11} /> Shared Memory
          </div>
          <h1 className="display" style={{ fontSize: 32, color: "var(--cream)", marginBottom: 6 }}>
            {strip.names || "Framoji Photostrip"}
          </h1>
          <p style={{ color: "var(--text-sub)", fontSize: 13 }}>
            Captured on {strip.createdAt ? new Date(strip.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Framoji"}
          </p>
        </motion.div>

        {/* Photostrip Image Display */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <motion.img
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            src={imageUrl}
            alt="Photostrip"
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
          <button
            type="button"
            onClick={downloadPhotostrip}
            disabled={downloading}
            className="btn btn-primary anim-glow"
            style={{ padding: "12px 28px", fontSize: 14, borderRadius: 11 }}
          >
            <Download size={14} /> {downloading ? "Downloading…" : "Download Image"}
          </button>
          <button className="btn btn-ghost" style={{ padding: "12px 20px", fontSize: 13, borderRadius: 11 }} onClick={shareNative}>
            {copied ? <Check size={13} color="#86EFAC" /> : <Share2 size={13} />}
            {copied ? "Link Copied!" : "Share Link"}
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: "12px 20px", fontSize: 13, borderRadius: 11 }}
            onClick={() => {
              trackEvent("qr_opened", { source: "photostrip_view" });
              setShowQr(true);
            }}
          >
            <QrCode size={13} /> Mobile QR
          </button>
        </div>

        {/* QR Modal */}
        <AnimatePresence>
          {showQr && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,9,16,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ maxWidth: 380, width: "100%", padding: 24, textAlign: "center", position: "relative" }}>
                <button onClick={() => setShowQr(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
                  <X size={18} />
                </button>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--violet-lt)" }}>
                  <QrCode size={22} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "var(--cream)" }}>Scan to View on Mobile</h3>
                <p style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 14, lineHeight: 1.5 }}>
                  Scan this QR code with your smartphone camera to view and download this photostrip directly.
                </p>
                <div style={{ background: "#fff", padding: 12, borderRadius: 12, display: "inline-block", marginBottom: 14 }}>
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 160, height: 160, display: "block" }} />
                  ) : (
                    <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 12 }}>
                      Generating QR…
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "6px 14px", fontSize: 11, borderRadius: 8 }}
                    onClick={async () => {
                      try {
                        if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(qrTargetUrl);
                          setCopiedQr(true);
                          setTimeout(() => setCopiedQr(false), 2000);
                        } else {
                          throw new Error("Clipboard unavailable");
                        }
                      } catch {
                        showToast("Clipboard access was denied.", "error");
                      }
                    }}
                  >
                    {copiedQr ? <Check size={11} color="#86EFAC" /> : <Copy size={11} />}
                    {copiedQr ? "Link Copied!" : "Copy Link"}
                  </button>
                  <a
                    href={qrTargetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                    style={{ padding: "6px 14px", fontSize: 11, borderRadius: 8, textDecoration: "none" }}
                  >
                    <ExternalLink size={11} /> Open
                  </a>
                </div>
                <div style={{ fontSize: 11, color: "var(--violet-lt)", fontWeight: 700, wordBreak: "break-all" }}>
                  {qrTargetUrl}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Floating Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              style={{
                position: "fixed",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 200,
                padding: "10px 20px",
                borderRadius: 99,
                background: toast.type === "error" ? "rgba(239,68,68,0.95)" : toast.type === "warning" ? "rgba(245,158,11,0.95)" : toast.type === "success" ? "rgba(34,197,94,0.95)" : "rgba(124,58,237,0.95)",
                backdropFilter: "blur(14px)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
