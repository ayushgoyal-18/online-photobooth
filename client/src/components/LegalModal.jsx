import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, FileText, Mail, Lock, Clock, Database, EyeOff } from "lucide-react";

export default function LegalModal({ isOpen, onClose, initialTab = "privacy" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setActiveTab(initialTab);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
          return;
        }
        if (e.key === "Tab" && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const firstBtn = modalRef.current.querySelector("button");
          if (firstBtn) firstBtn.focus();
        }
      }, 50);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, initialTab, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="card glass-card"
          style={{
            width: "100%",
            maxWidth: 680,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: 0,
            background: "rgba(14, 14, 26, 0.95)",
            border: "1px solid var(--border-bright)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(124, 58, 237, 0.15)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--violet-lt)",
                }}
              >
                {activeTab === "privacy" ? <ShieldCheck size={18} /> : activeTab === "terms" ? <FileText size={18} /> : <Mail size={18} />}
              </div>
              <div>
                <h3 className="display" style={{ fontSize: 18, margin: 0, color: "var(--cream)" }}>
                  {activeTab === "privacy" ? "Privacy Policy" : activeTab === "terms" ? "Terms of Use" : "Contact & Support"}
                </h3>
                <span style={{ fontSize: 11, color: "var(--text-sub)" }}>Framoji — Privacy-first virtual photobooth</span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-sub)",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              padding: "0 24px",
              gap: 8,
              background: "rgba(0, 0, 0, 0.2)",
            }}
          >
            {[
              { id: "privacy", label: "Privacy Policy", icon: <ShieldCheck size={13} /> },
              { id: "terms", label: "Terms of Use", icon: <FileText size={13} /> },
              { id: "contact", label: "Contact", icon: <Mail size={13} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === t.id ? "2px solid var(--violet-lt)" : "2px solid transparent",
                  color: activeTab === t.id ? "var(--violet-lt)" : "var(--text-sub)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div
            style={{
              padding: "24px",
              overflowY: "auto",
              flex: 1,
              color: "var(--text)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {activeTab === "privacy" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.2)", display: "flex", gap: 10, alignItems: "center" }}>
                  <EyeOff size={18} color="var(--violet-lt)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--violet-lt)", fontWeight: 500 }}>
                    Framoji does not use cross-site advertising trackers or tracking cookies. Anonymous session-based analytics are used to measure product usage.
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Lock size={14} color="var(--rose)" /> Real-Time Video & Media Privacy
                  </h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    All live camera streams are peer-to-peer via WebRTC and encrypted in transit. Video streams are never recorded or stored on our servers. Photostrip snapshots are merged and generated directly in your browser.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Database size={14} color="var(--violet-lt)" /> Photostrip Storage & Sharing
                  </h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    When you export or generate a QR code for your finished photostrip, the rendered composite image is hosted on Cloudinary to enable downloads and link-based sharing. Individual photostrip pages are configured with a <code style={{ color: "var(--violet-lt)", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>noindex, nofollow</code> robots directive so search engines are instructed not to index them.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} color="var(--mint)" /> Anonymous Analytics & 90-Day Automatic Deletion
                  </h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    To measure aggregate feature usage and improve stability, Framoji collects anonymous telemetry (e.g., visits, chosen photobooth layouts, download clicks). We do <strong>not</strong> collect or store IP addresses, device identifiers, camera information, or user accounts. All analytics documents are permanently and automatically purged after <strong>90 days</strong> via MongoDB TTL indexes.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6 }}>
                    No Tracking Cookies
                  </h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    Framoji does not use third-party advertising cookies or cross-site tracking trackers. Temporary session identifiers are held in your browser's <code style={{ color: "var(--violet-lt)", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>sessionStorage</code> and cleared automatically when you close your tab.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "terms" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6 }}>1. Usage & Purpose</h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    Framoji is provided free for personal, social, and non-commercial entertainment. By using this platform, you agree to respect other participants' privacy and consent when capturing and sharing photos in shared booths.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6 }}>2. User Content Responsibility</h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    You retain ownership of any images created in your photobooth sessions. You are solely responsible for the content you generate, download, or share through booth invite links and QR codes.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--cream)", marginBottom: 6 }}>3. Service Availability & Rate Limits</h4>
                  <p style={{ color: "var(--text-sub)", margin: 0 }}>
                    Framoji is provided "as is" without warranty. To ensure uptime and prevent denial-of-service, automated abuse or high-frequency event spamming is subject to rate limiting and temporary IP throttling.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(124, 58, 237, 0.15)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--violet-lt)" }}>
                  <Mail size={22} />
                </div>
                <h4 className="display" style={{ fontSize: 18, margin: 0, color: "var(--cream)" }}>Have Feedback or Questions?</h4>
                <p style={{ color: "var(--text-sub)", fontSize: 13, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                  Framoji is built with love for high-quality remote photobooth memories. If you have questions about privacy, feature suggestions, or need help with a booth:
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                  <a
                    href="https://github.com/ayushgoyal-18/online-photobooth"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ padding: "10px 20px", fontSize: 13, textDecoration: "none" }}
                  >
                    GitHub Repository
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <button className="btn btn-primary" style={{ padding: "8px 22px", fontSize: 13 }} onClick={onClose}>
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
