import { useNavigate } from "react-router-dom";
import { Camera, Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", flexDirection: "column" }} className="aurora-bg">
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid var(--border)", background: "rgba(8,8,15,0.84)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontWeight: 800, fontSize: 18, fontFamily: "DM Sans, sans-serif" }}>
          fra<span style={{ color: "var(--violet-lt)" }}>moji</span>
        </button>
        <button className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => navigate("/create")}>
          <Camera size={13} /> Create booth
        </button>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", zIndex: 5 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 420, width: "100%", padding: 36, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎞️</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--violet-lt)", textTransform: "uppercase", letterSpacing: "0.1em" }}>404 Page Not Found</span>
          <h1 className="display" style={{ fontSize: 26, color: "var(--cream)", marginTop: 6, marginBottom: 10 }}>This page doesn't exist</h1>
          <p style={{ color: "var(--text-sub)", fontSize: 13, lineHeight: 1.6, marginBottom: 26 }}>
            The link may be expired, mistyped, or no longer available.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/create")} className="btn btn-primary" style={{ padding: "11px 24px", fontSize: 13, borderRadius: 10 }}>
              Create a booth <ArrowRight size={13} />
            </button>
            <button onClick={() => navigate("/")} className="btn btn-ghost" style={{ padding: "11px 20px", fontSize: 13, borderRadius: 10 }}>
              <Home size={13} /> Return home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
