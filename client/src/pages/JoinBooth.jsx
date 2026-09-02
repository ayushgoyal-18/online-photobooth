import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Hash } from "lucide-react";

export default function JoinBooth() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const join = () => {
    if (!name.trim()) { setError("Enter your name so the host can see who joined."); return; }
    const trimmed = input.trim();
    if (!trimmed) { setError("Paste a room link or enter the room code."); return; }
    let code = trimmed;
    const match = trimmed.match(/\/room\/([a-zA-Z0-9_-]{6,30})(?:\/)?$/i);
    if (match) code = match[1];
    if (!/^[a-zA-Z0-9_-]{6,30}$/.test(code)) {
      setError("Enter a valid room code (6–30 characters).");
      return;
    }
    navigate(`/room/${code}`, { state: { guestName: name.trim() } });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", flexDirection: "column" }} className="aurora-bg">
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid var(--border)", background: "rgba(8,8,15,0.84)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontWeight: 800, fontSize: 16, fontFamily: "DM Sans, sans-serif" }}>
          fra<span style={{ color: "var(--violet-lt)" }}>moji</span>
        </button>
        <button className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => navigate("/create")}>Create booth</button>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 22, position: "relative", zIndex: 5 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 420 }}>
          <h1 className="display" style={{ fontSize: 36, marginBottom: 8, color: "var(--cream)" }}>Join a booth</h1>
          <p style={{ color: "var(--text-sub)", marginBottom: 28, fontSize: 14, lineHeight: 1.65 }}>
            Your friend sent you a link or a room code. Add your name and paste it below.
          </p>

          <div className="card" style={{ padding: 22, marginBottom: 14 }}>
            <label htmlFor="join-name" style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Your name</label>
            <input id="join-name" name="name" autoComplete="name" className="field" placeholder="e.g. Priya" value={name} onChange={e => { setName(e.target.value); setError(""); }} style={{ marginBottom: 14 }} autoFocus />
            <label htmlFor="join-room" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              <Hash size={11} color="var(--violet-lt)" /> Room link or code
            </label>
            <input id="join-room" name="room" className="field" placeholder="https://framoji.app/room/abc123  or  abc123" value={input} onChange={e => { setInput(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && join()} />
            {error && <p style={{ color: "#F87171", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{error}</p>}
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 14 }} onClick={join}>
            Join booth <ArrowRight size={14} />
          </motion.button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0", color: "var(--text-sub)", fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            or
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <button className="btn btn-ghost" style={{ width: "100%", padding: 12, fontSize: 13 }} onClick={() => navigate("/create")}>
            Create your own booth
          </button>

          <div style={{ marginTop: 22, padding: "13px 16px", borderRadius: 11, background: "rgba(124,58,237,0.055)", border: "1px solid rgba(124,58,237,0.12)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Hash size={12} color="var(--violet-lt)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.6 }}>
              Room codes are 6–30 characters. You can also paste the full invite URL and it'll extract the code automatically.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}