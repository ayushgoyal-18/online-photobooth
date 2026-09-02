import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Check, QrCode, X, Camera, Sparkles } from "lucide-react";

export default function PhotostripView() {
  const { stripId } = useParams();
  const navigate = useNavigate();
  const [strip, setStrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

  useEffect(() => {
    // 1. Try fetching from backend API
    fetch(`${SERVER_URL}/api/photostrips/${stripId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Strip not found on server");
        return res.json();
      })
      .then((data) => {
        setStrip(data);
        setLoading(false);
      })
      .catch(() => {
        // 2. Fallback to localStorage gallery
        try {
          const gallery = JSON.parse(localStorage.getItem("framoji-gallery") || "[]");
          const found = gallery.find((g) => g.id === stripId || g.roomId === stripId);
          if (found) {
            setStrip(found);
            setLoading(false);
            return;
          }
        } catch (_) { }
        setError("Photostrip not found or link has expired.");
        setLoading(false);
      });
  }, [stripId, SERVER_URL]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `${strip?.names || "Photostrip"} on Framoji`,
        url: window.location.href,
      }).catch(() => { });
    } else {
      copyShareLink();
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
          <a
            href={imageUrl}
            download={`framoji-${stripId}.png`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary anim-glow"
            style={{ padding: "12px 28px", fontSize: 14, borderRadius: 11, textDecoration: "none" }}
          >
            <Download size={14} /> Download Image
          </a>
          <button className="btn btn-ghost" style={{ padding: "12px 20px", fontSize: 13, borderRadius: 11 }} onClick={shareNative}>
            {copied ? <Check size={13} color="#86EFAC" /> : <Share2 size={13} />}
            {copied ? "Link Copied!" : "Share Link"}
          </button>
          <button className="btn btn-ghost" style={{ padding: "12px 20px", fontSize: 13, borderRadius: 11 }} onClick={() => setShowQr(true)}>
            <QrCode size={13} /> Mobile QR
          </button>
        </div>

        {/* QR Modal */}
        <AnimatePresence>
          {showQr && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,9,16,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ maxWidth: 360, width: "100%", padding: 24, textAlign: "center", position: "relative" }}>
                <button onClick={() => setShowQr(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
                  <X size={18} />
                </button>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--violet-lt)" }}>
                  <QrCode size={22} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "var(--cream)" }}>Scan to View on Mobile</h3>
                <p style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 16 }}>
                  Scan with your phone camera to open and save this photostrip.
                </p>
                <div style={{ background: "#fff", padding: 12, borderRadius: 12, display: "inline-block", marginBottom: 14 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`} alt="QR Code" style={{ width: 160, height: 160, display: "block" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--violet-lt)", fontWeight: 700, wordBreak: "break-all" }}>
                  {window.location.href}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
