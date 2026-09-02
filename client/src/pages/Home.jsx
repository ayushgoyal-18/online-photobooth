import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Camera, Download, Zap, Users, Film, Link2, ArrowRight,
  Heart, UserCircle, Trash2, Images, X, Sparkles,
} from "lucide-react";

const FEATURES = [
  { icon: <Camera size={18} />, title: "Simultaneous Camera Capture", desc: "Cameras fire at the exact same millisecond. Your faces merge into side-by-side frames in real time." },
  { icon: <Users size={18} />, title: "Multi-User Group Booths", desc: "Connect solo, as a couple, or with groups up to 6 people from anywhere in the world." },
  { icon: <Film size={18} />, title: "3 Authentic Strip Styles", desc: "Classic, Polaroid, and Retro Film with real film sprocket holes, grain, and dates." },
  { icon: <Zap size={18} />, title: "Filters & Sticker Studio", desc: "8 vintage color filters, draggable stickers, custom captions, and interactive retakes." },
  { icon: <Link2 size={18} />, title: "Instant Room Sharing", desc: "Share a 6-letter room code or mobile QR code. No app downloads or accounts required." },
  { icon: <Download size={18} />, title: "Print-Ready PNG Download", desc: "Export 3× high-resolution PNG photostrips ready for social sharing or printing." },
];

const MODES = [
  { icon: <UserCircle size={16} />, label: "Solo", desc: "Just you and your camera" },
  { icon: <Heart size={16} />, label: "Couple", desc: "Side-by-side love frames" },
  { icon: <Users size={16} />, label: "Friends & Family", desc: "Groups up to 6 people" },
];

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
];

function StripPreview({ layout }) {
  const isRetro = layout === "retro";
  const isPolaroid = layout === "polaroid";
  const bg = isRetro ? "#241A0C" : isPolaroid ? "#F5EFE6" : "#FFFFFF";
  const pad = isPolaroid ? "12px 10px 24px" : isRetro ? "5px 17px 12px" : "11px 11px 18px";

  return (
    <div style={{
      background: bg,
      padding: pad,
      position: "relative",
      borderRadius: isRetro ? 2 : isPolaroid ? 4 : 6,
      boxShadow: isRetro
        ? "0 0 0 2px #150F06, 0 16px 40px rgba(0,0,0,0.6)"
        : isPolaroid
          ? "0 3px 0 #c8b89a, 0 16px 40px rgba(0,0,0,0.4)"
          : "0 4px 0 #d0d0d0, 0 20px 48px rgba(0,0,0,0.45)",
      width: "100%",
      fontFamily: isRetro ? "'Courier New', monospace" : "DM Sans, sans-serif",
    }}>
      {/* Retro Sprocket Holes */}
      {isRetro && ["left", "right"].map(side => (
        <div key={side} style={{ position: "absolute", [side]: 2, top: 0, bottom: 0, width: 11, display: "flex", flexDirection: "column", justifyContent: "space-evenly", padding: "5px 0" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: 1, background: "#150F06", border: "1px solid #352A18", margin: "0 auto" }} />
          ))}
        </div>
      ))}

      {isPolaroid ? (
        <div>
          <div style={{ background: "#FFFFFF", padding: "6px 6px 28px", borderRadius: 2, boxShadow: "0 3px 10px rgba(0,0,0,0.15)", marginBottom: 8, position: "relative" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              <img src={SAMPLE_PHOTOS[0]} alt="" style={{ width: "100%", height: 46, objectFit: "cover", borderRadius: 1 }} />
              <img src={SAMPLE_PHOTOS[1]} alt="" style={{ width: "100%", height: 46, objectFit: "cover", borderRadius: 1 }} />
            </div>
            <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", fontSize: 9, fontFamily: "Georgia, serif", color: "#444", fontStyle: "italic" }}>
              Best Memories ♡
            </div>
          </div>
          <div style={{ background: "#FFFFFF", padding: "6px 6px 28px", borderRadius: 2, boxShadow: "0 3px 10px rgba(0,0,0,0.15)", position: "relative", transform: "rotate(1.5deg)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              <img src={SAMPLE_PHOTOS[2]} alt="" style={{ width: "100%", height: 46, objectFit: "cover", borderRadius: 1 }} />
              <img src={SAMPLE_PHOTOS[3]} alt="" style={{ width: "100%", height: 46, objectFit: "cover", borderRadius: 1 }} />
            </div>
            <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", fontSize: 9, fontFamily: "'Courier New', monospace", color: "#666" }}>
              Summer 2026
            </div>
          </div>
        </div>
      ) : isRetro ? (
        <div>
          <div style={{ textAlign: "center", padding: "3px 0 2px", borderBottom: "1px solid #352A18", marginBottom: 5 }}>
            <div style={{ fontSize: 6, color: "#A07820", letterSpacing: "0.15em", textTransform: "uppercase" }}>FRAMOJI · RETRO</div>
          </div>
          {[SAMPLE_PHOTOS[0], SAMPLE_PHOTOS[1], SAMPLE_PHOTOS[2]].map((photo, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#7A5C1A", marginBottom: 1 }}>
                <span>◀ 0{i + 1} ▶</span>
                <span>SEP 26</span>
              </div>
              <img src={photo} alt="" style={{ width: "100%", height: 46, objectFit: "cover", borderRadius: 1, filter: "sepia(35%) contrast(1.05)", border: "1px solid #150F06" }} />
            </div>
          ))}
        </div>
      ) : (
        /* Classic Layout */
        <div>
          {[SAMPLE_PHOTOS[0], SAMPLE_PHOTOS[1], SAMPLE_PHOTOS[2]].map((photo, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 4 : 0 }}>
              <img src={photo} alt="" style={{ width: "100%", height: 48, objectFit: "cover", borderRadius: 3, border: "1.5px solid #EDE9FE" }} />
            </div>
          ))}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>Aria & Liam</div>
            <div style={{ fontSize: 7, fontStyle: "italic", color: "#7C3AED" }}>"Together Forever ✨"</div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 6, fontSize: 7, color: isRetro ? "#A07820" : "#A09070", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
        framoji.app
      </div>
    </div>
  );
}

function HeroStrip() {
  return (
    <div className="anim-float-strip" style={{ width: 174, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", inset: -28, borderRadius: 20, pointerEvents: "none", background: "radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 68%)", filter: "blur(18px)" }} />
      <StripPreview layout="classic" />
    </div>
  );
}

function HowStep({ n, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: 0.44 }}
      className="card" style={{ padding: 22 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--violet-lt)" }}>{n}</span>
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{title}</h3>
      <p style={{ color: "var(--text-sub)", fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [gallery, setGallery] = useState(() => {
    try { return JSON.parse(localStorage.getItem("framoji-gallery") || "[]"); }
    catch { return []; }
  });

  const deleteGalleryItem = (id, e) => {
    e.stopPropagation();
    const updated = gallery.filter(item => item.id !== id);
    setGallery(updated);
    try { localStorage.setItem("framoji-gallery", JSON.stringify(updated)); } catch (_) { }
  };

  const quickJoin = () => {
    const t = code.trim();
    if (!t) return;
    const m = t.match(/\/room\/([a-zA-Z0-9_-]{6,30})(?:\/)?$/i);
    const roomCode = m ? m[1] : t;
    if (/^[a-zA-Z0-9_-]{6,30}$/.test(roomCode)) {
      navigate(`/room/${roomCode}`);
    } else {
      navigate("/join");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }} className="aurora-bg">
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-16%", left: "-5%", width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: "-5%", right: "-5%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 60%)" }} />
      </div>

      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,8,15,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px" }}>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
            fra<span style={{ color: "var(--violet-lt)" }}>moji</span>
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-outline" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => navigate("/join")}>Join booth</button>
            <button className="btn btn-primary" style={{ padding: "8px 20px", fontSize: 13 }} onClick={() => navigate("/create")}>Create booth</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 22px 52px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 5 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 99, padding: "5px 14px", marginBottom: 22 }}>
            <Sparkles size={13} color="var(--violet-lt)" />
            <span style={{ fontSize: 12, color: "var(--violet-lt)", fontWeight: 700, letterSpacing: "0.03em" }}>Virtual Photobooth — No App Needed</span>
          </div>

          <h1 className="display" style={{ fontSize: "clamp(40px, 4.8vw, 64px)", marginBottom: 18, color: "var(--cream)" }}>
            Capture moments.<br />Any <span className="grad-text">distance</span>.
          </h1>

          <p style={{ color: "var(--text-sub)", fontSize: 15, lineHeight: 1.74, marginBottom: 32, maxWidth: 480 }}>
            Framoji syncs webcams in real time, merges multi-camera shots into side-by-side frames, and exports print-ready photostrips in seconds.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            <button className="btn btn-primary anim-glow" style={{ padding: "14px 28px", fontSize: 15, borderRadius: 12 }} onClick={() => navigate("/create")}>
              Create a booth <ArrowRight size={15} />
            </button>
            <button className="btn btn-ghost" style={{ padding: "14px 24px", fontSize: 15, borderRadius: 12 }} onClick={() => navigate("/join")}>
              Join with code
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", maxWidth: 440 }}>
            <input
              className="field"
              placeholder="Paste a room code or link to join"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && quickJoin()}
              style={{ background: "transparent", border: "none", padding: "4px 0", flex: 1, fontSize: 13 }}
            />
            <button className="btn btn-rose" style={{ padding: "8px 16px", fontSize: 12, borderRadius: 8, flexShrink: 0 }} onClick={quickJoin}>
              Join Room
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="hide-mobile" style={{ display: "flex", justifyContent: "center" }}>
          <HeroStrip />
        </motion.div>
      </section>

      {/* Saved Gallery Section (Rendered if user has saved strips) */}
      {gallery.length > 0 && (
        <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 22px 56px", position: "relative", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Images size={18} color="var(--violet-lt)" />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--cream)" }}>Your Saved Photostrips</h2>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-sub)" }}>{gallery.length} saved</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {gallery.map(item => (
              <motion.div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`View photostrip by ${item.names || "Framoji"}`}
                whileHover={{ scale: 1.03 }}
                className="card"
                style={{ padding: 10, cursor: "pointer", position: "relative", overflow: "hidden" }}
                onClick={() => setPreviewItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPreviewItem(item);
                  }
                }}
              >
                <button
                  onClick={(e) => deleteGalleryItem(item.id, e)}
                  style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 24, height: 24, borderRadius: "50%", background: "rgba(239,68,68,0.85)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  title="Delete photostrip"
                >
                  <Trash2 size={12} />
                </button>
                <img src={item.cloudinaryUrl || item.dataUrl} alt={`Photostrip by ${item.names || "Framoji"}`} style={{ width: "100%", height: 220, objectFit: "contain", borderRadius: 8, background: "rgba(0,0,0,0.3)" }} />
                <div style={{ marginTop: 8, padding: "0 4px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.names || "Photostrip"}</div>
                  <div style={{ fontSize: 10, color: "var(--text-sub)", marginTop: 2 }}>{item.createdAt}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Saved Gallery Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,9,16,0.92)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ maxWidth: 460, width: "100%", padding: 24, textAlign: "center", position: "relative" }}>
              <button onClick={() => setPreviewItem(null)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
                <X size={20} />
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: "var(--cream)" }}>{previewItem.names || "Saved Photostrip"}</h3>
              <p style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 16 }}>Saved on {previewItem.createdAt}</p>
              <img src={previewItem.cloudinaryUrl || previewItem.dataUrl} alt={`Photostrip preview for ${previewItem.names || "Framoji"}`} style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: 10, marginBottom: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <a href={previewItem.cloudinaryUrl || previewItem.dataUrl} download={`framoji-${previewItem.roomId || "strip"}.png`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: 13, textDecoration: "none" }}>
                  <Download size={14} /> View / Download Strip
                </a>
                <button onClick={() => setPreviewItem(null)} className="btn btn-ghost" style={{ padding: "10px 18px", fontSize: 13 }}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3 Strip Styles Section with Real Photostrip Previews */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 22px 76px", position: "relative", zIndex: 5 }}>
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <p style={{ color: "var(--violet-lt)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Actual Output Preview</p>
          <h2 className="display" style={{ fontSize: "clamp(26px, 3.8vw, 42px)", color: "var(--cream)" }}>Three Authentic Photostrip Styles</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 840, margin: "0 auto" }}>
          {[
            { layout: "classic", label: "Classic Strip", desc: "Clean borders, serif typography, elegant layout." },
            { layout: "polaroid", label: "Polaroid Instant", desc: "Wide white border, handwritten feel, stacked style." },
            { layout: "retro", label: "Retro Film", desc: "Film sprocket holes, warm grain, vintage stamps." },
          ].map((item, i) => (
            <motion.div key={item.layout} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} style={{ textAlign: "center" }}>
              <div style={{ maxWidth: 180, margin: "0 auto 14px" }}>
                <StripPreview layout={item.layout} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.5 }}>{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 22px 76px", position: "relative", zIndex: 5 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p style={{ color: "var(--violet-lt)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Simple & Fast</p>
          <h2 className="display" style={{ fontSize: "clamp(26px, 3.8vw, 42px)", color: "var(--cream)" }}>How Framoji Works</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <HowStep n="01" delay={0} title="Create a Booth" desc="Pick your session type — Solo, Couple, or Friends & Family — and select your preferred layout." />
          <HowStep n="02" delay={0.07} title="Invite Friends" desc="Share a 6-letter room code or mobile QR code. Friends join instantly from any device." />
          <HowStep n="03" delay={0.14} title="Synchronized Snap" desc="Synced audio countdown fires all cameras simultaneously into a combined frame." />
          <HowStep n="04" delay={0.21} title="Customize & Download" desc="Apply filters, drag stickers, write a caption, and download a 3× high-res PNG." />
        </div>
      </section>

      {/* Features Overview Section */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 22px 76px", position: "relative", zIndex: 5 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 className="display" style={{ fontSize: "clamp(24px, 3.5vw, 40px)", color: "var(--cream)" }}>Designed for Distance</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--violet-lt)" }}>{f.icon}</div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</h3>
                <p style={{ color: "var(--text-sub)", fontSize: 12, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modes CTA Section */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 22px 76px", position: "relative", zIndex: 5 }}>
        <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(244,63,94,0.05))", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 24, padding: "48px 36px", textAlign: "center" }}>
          <h2 className="display" style={{ fontSize: "clamp(24px, 3.5vw, 42px)", marginBottom: 12, color: "var(--cream)" }}>Ready for your session?</h2>
          <p style={{ color: "var(--text-sub)", marginBottom: 28, fontSize: 14, maxWidth: 460, margin: "0 auto 28px" }}>
            Three tailored modes — Solo, Couple, or Friends & Family — designed for high-resolution instant memories.
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginBottom: 30 }}>
            {MODES.map(m => (
              <div key={m.label} style={{ padding: "8px 18px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, color: "var(--text)" }}>
                <span style={{ color: "var(--violet-lt)" }}>{m.icon}</span> {m.label}
              </div>
            ))}
          </div>
          <button className="btn btn-primary anim-glow" style={{ padding: "14px 36px", fontSize: 15, borderRadius: 12 }} onClick={() => navigate("/create")}>
            Start your booth <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          position: "relative",
          zIndex: 5,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 16 }}>
          fra<span style={{ color: "var(--violet-lt)" }}>moji</span>
        </span>

        <span style={{ fontSize: 12, color: "var(--text-sub)" }}>
          Virtual online photobooth for friends & family everywhere
        </span>
      </footer>
    </div>
  );
}