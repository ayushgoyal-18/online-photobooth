import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Check, Users,
  UserCircle, Heart, Home as HomeIcon,
  Film, Camera, Grid, Sparkles, Wand2
} from "lucide-react";

const MODES = [
  {
    id: "solo",
    icon: <UserCircle size={26} />,
    label: "Solo Session",
    desc: "Just you, cute poses & zero pressure",
    badge: "1 Person",
    participants: "solo",
    selfLabel: "Your Name",
    partnerLabel: null,
    friendCount: false,
    ctaLabel: "Start Solo Session ✨",
    waitText: null,
    stripFooter: "Captured with Framoji",
    color: "from-purple-500/20 to-indigo-500/20",
  },
  {
    id: "couple",
    icon: <Heart size={26} color="#F43F5E" />,
    label: "Couple Booth",
    desc: "Cute memories for two people in love",
    badge: "2 People",
    participants: "duo",
    selfLabel: "Your Name",
    partnerLabel: "Partner's Name",
    friendCount: false,
    ctaLabel: "Create Couple Booth 💕",
    waitText: "Waiting for your partner…",
    stripFooter: "Together Forever",
    color: "from-rose-500/20 to-pink-500/20",
  },
  {
    id: "friends",
    icon: <Users size={26} color="#A78BFA" />,
    label: "Friends & Family",
    desc: "Group fun for up to 6 friends online",
    badge: "Up to 6 People",
    participants: "group",
    selfLabel: "Your Name",
    partnerLabel: null,
    friendCount: true,
    ctaLabel: "Launch Group Booth 🎉",
    waitText: "Waiting for your group…",
    stripFooter: "Best Memories",
    color: "from-violet-500/20 to-fuchsia-500/20",
  },
];

const LAYOUTS = [
  {
    id: "classic",
    icon: <Grid size={22} />,
    label: "Classic Strip",
    tag: "Most Popular",
    desc: "Timeless photobooth strip with clean border",
  },
  {
    id: "polaroid",
    icon: <Camera size={22} />,
    tag: "Retro Vibe",
    label: "Polaroid",
    desc: "Vintage wide white border with instant feel",
  },
  {
    id: "retro",
    icon: <Film size={22} />,
    tag: "Vintage Film",
    label: "Retro Film",
    desc: "Aesthetic film sprocket holes & date stamp",
  },
];

const PHOTO_COUNTS = [3, 4, 6];

function StepDot({ n, active, done }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        transition: "all 0.25s ease",
        background: done
          ? "var(--violet)"
          : active
            ? "rgba(124,58,237,0.25)"
            : "rgba(255,255,255,0.04)",
        border: `2px solid ${done || active ? "var(--violet)" : "var(--border)"
          }`,
        color: done || active ? "#fff" : "var(--text-sub)",
        boxShadow: active ? "0 0 16px rgba(124,58,237,0.4)" : "none",
      }}
    >
      {done ? <Check size={12} /> : n}
    </div>
  );
}

function StepBar({ step }) {
  const labels = ["Mode", "Names", "Style", "Launch"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StepDot n={i + 1} active={step === i + 1} done={step > i + 1} />
          <span
            className="hide-mobile"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: step === i + 1 ? "var(--text)" : "var(--text-sub)",
            }}
          >
            {label}
          </span>
          {i < labels.length - 1 && (
            <div
              style={{
                width: 24,
                height: 2,
                borderRadius: 99,
                margin: "0 2px",
                background: step > i + 1 ? "var(--violet)" : "var(--border)",
                transition: "background 0.25s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Slide({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export default function CreateBooth() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("friends");
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [friendCount, setFriendCount] = useState(3);
  const [layout, setLayout] = useState("classic");
  const [photoCount, setPhotoCount] = useState(4);

  const modeObj = MODES.find((m) => m.id === mode) || MODES[2];
  const canNext1 = !!mode;
  const canNext2 = name1.trim().length > 0;

  const handleCreate = () => {
    const roomId = crypto.randomUUID().replace(/-/g, "").substring(0, 10);
    const config = {
      theme: mode,
      layout,
      photoCount,
      participant1: name1.trim(),
      participant2: name2.trim(),
      friendCount: modeObj?.participants === "group" ? friendCount : null,
      isSolo: mode === "solo",
      modeConfig: {
        id: modeObj.id,
        label: modeObj.label,
        participants: modeObj.participants,
        waitText: modeObj.waitText,
        ctaLabel: modeObj.ctaLabel,
        stripFooter: modeObj.stripFooter,
      },
    };

    try {
      localStorage.setItem(
        `framoji-room-${roomId}`,
        JSON.stringify({ ...config, isHost: true })
      );
    } catch (_) { }

    navigate(`/room/${roomId}`, { state: { ...config, isHost: true } });
  };

  const Step1 = (
    <Slide key="s1">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span className="cute-badge" style={{ marginBottom: 10 }}>
          <Sparkles size={12} /> Step 1 of 4
        </span>
        <h1 className="display" style={{ fontSize: 34, color: "var(--cream)", marginBottom: 6 }}>
          Choose your booth vibe
        </h1>
        <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
          Select who you're taking photos with today!
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {MODES.map((m) => (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setMode(m.id)}
            className={`card ${mode === m.id ? "anim-glow" : ""}`}
            style={{
              padding: "18px 20px",
              cursor: "pointer",
              textAlign: "left",
              background: mode === m.id ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${mode === m.id ? "var(--violet)" : "var(--border)"}`,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: mode === m.id ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: mode === m.id ? "var(--mauve)" : "var(--text-sub)",
                }}
              >
                {m.icon}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>{m.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 99,
                      background: mode === m.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)",
                      color: mode === m.id ? "var(--mauve)" : "var(--text-sub)",
                    }}
                  >
                    {m.badge}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-sub)" }}>{m.desc}</div>
              </div>
            </div>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${mode === m.id ? "var(--violet)" : "var(--border)"}`,
                background: mode === m.id ? "var(--violet)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mode === m.id && <Check size={12} color="#fff" />}
            </div>
          </motion.button>
        ))}
      </div>

      <button
        className="btn btn-primary"
        style={{
          width: "100%",
          padding: 15,
          fontSize: 15,
          borderRadius: 14,
          opacity: canNext1 ? 1 : 0.4,
          cursor: canNext1 ? "pointer" : "not-allowed",
        }}
        onClick={() => canNext1 && setStep(2)}
      >
        Continue <ChevronRight size={16} />
      </button>
    </Slide>
  );

  const Step2 = (
    <Slide key="s2">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span className="cute-badge" style={{ marginBottom: 10 }}>
          <Sparkles size={12} /> Step 2 of 4
        </span>
        <h1 className="display" style={{ fontSize: 34, color: "var(--cream)", marginBottom: 6 }}>
          Who's joining the booth?
        </h1>
        <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
          {mode === "solo"
            ? "Your name will be printed on the final photostrip."
            : "Names will be printed nicely on your photostrip header!"}
        </p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <label
          htmlFor="host-name"
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 800,
            color: "var(--mauve)",
            marginBottom: 8,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {modeObj.selfLabel}
        </label>
        <input
          id="host-name"
          name="hostName"
          className="field"
          placeholder="Enter your name (e.g. Priya)"
          value={name1}
          onChange={(e) => setName1(e.target.value)}
          style={{ marginBottom: modeObj.partnerLabel ? 20 : 0, padding: 13, fontSize: 15 }}
          autoFocus
        />

        {modeObj.partnerLabel && (
          <>
            <label
              htmlFor="partner-name"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 800,
                color: "var(--mauve)",
                marginBottom: 8,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {modeObj.partnerLabel}
            </label>
            <input
              id="partner-name"
              name="partnerName"
              className="field"
              placeholder="Partner's name (e.g. Rahul)"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              style={{ padding: 13, fontSize: 15 }}
            />
          </>
        )}

        {modeObj.friendCount && (
          <div style={{ marginTop: 22 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 800,
                color: "var(--mauve)",
                marginBottom: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <Users size={13} /> Total Participants
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setFriendCount(n)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 10,
                    cursor: "pointer",
                    background:
                      friendCount === n
                        ? "rgba(124,58,237,0.2)"
                        : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${friendCount === n ? "var(--violet)" : "var(--border)"
                      }`,
                    color: friendCount === n ? "var(--mauve)" : "var(--text-sub)",
                    fontWeight: 800,
                    fontSize: 16,
                    transition: "all 0.15s ease",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 10 }}>
              Up to 6 friends can join from their own devices!
            </p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ padding: "14px 18px", borderRadius: 12 }}
          onClick={() => setStep(1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn btn-primary"
          style={{
            flex: 1,
            padding: 14,
            fontSize: 15,
            borderRadius: 12,
            opacity: canNext2 ? 1 : 0.4,
            cursor: canNext2 ? "pointer" : "not-allowed",
          }}
          onClick={() => canNext2 && setStep(3)}
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </Slide>
  );

  const Step3 = (
    <Slide key="s3">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span className="cute-badge" style={{ marginBottom: 10 }}>
          <Sparkles size={12} /> Step 3 of 4
        </span>
        <h1 className="display" style={{ fontSize: 34, color: "var(--cream)", marginBottom: 6 }}>
          Pick layout & photos
        </h1>
        <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
          Customize your photostrip design style!
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {LAYOUTS.map((l) => (
          <motion.button
            key={l.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setLayout(l.id)}
            className={`card ${layout === l.id ? "anim-glow" : ""}`}
            style={{
              padding: "18px 12px",
              cursor: "pointer",
              textAlign: "center",
              background: layout === l.id ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${layout === l.id ? "var(--violet)" : "var(--border)"}`,
            }}
          >
            <div style={{ color: layout === l.id ? "var(--mauve)" : "var(--violet-lt)", marginBottom: 8 }}>
              {l.icon}
            </div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>
              {l.label}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-sub)", lineHeight: 1.3 }}>
              {l.desc}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 800,
            color: "var(--mauve)",
            marginBottom: 10,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Number of Photos to Shoot
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          {PHOTO_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setPhotoCount(n)}
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: 12,
                cursor: "pointer",
                background:
                  photoCount === n ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${photoCount === n ? "var(--violet)" : "var(--border)"
                  }`,
                color: photoCount === n ? "var(--mauve)" : "var(--text-sub)",
                fontWeight: 800,
                fontSize: 18,
                transition: "all 0.15s ease",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {n} Shots
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ padding: "14px 18px", borderRadius: 12 }}
          onClick={() => setStep(2)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1, padding: 14, fontSize: 15, borderRadius: 12 }}
          onClick={() => setStep(4)}
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </Slide>
  );

  const Step4 = (
    <Slide key="s4">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span className="cute-badge" style={{ marginBottom: 10 }}>
          <Wand2 size={12} /> Step 4 of 4
        </span>
        <h1 className="display" style={{ fontSize: 34, color: "var(--cream)", marginBottom: 6 }}>
          Ready to open your booth!
        </h1>
        <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
          Review your session configuration below.
        </p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        {[
          ["Session Vibe", modeObj.label],
          ["Host Name", name1.trim()],
          name2.trim() ? ["Partner Name", name2.trim()] : null,
          modeObj.participants === "group" ? ["Group Size", `${friendCount} people`] : null,
          ["Strip Layout", LAYOUTS.find((l) => l.id === layout)?.label],
          ["Photo Count", `${photoCount} photos`],
        ]
          .filter(Boolean)
          .map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--text-sub)" }}>{k}</span>
              <span style={{ fontWeight: 800, color: "var(--mauve)" }}>{v}</span>
            </div>
          ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ padding: "14px 18px", borderRadius: 12 }}
          onClick={() => setStep(3)}
        >
          <ChevronLeft size={16} />
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary anim-glow"
          style={{ flex: 1, padding: 15, fontSize: 15, borderRadius: 12 }}
          onClick={handleCreate}
        >
          {modeObj.ctaLabel}
        </motion.button>
      </div>
    </Slide>
  );

  const steps = [Step1, Step2, Step3, Step4];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }} className="aurora-bg">
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(9,9,16,0.88)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text)",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 18,
            fontFamily: "DM Sans, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          fra<span style={{ color: "var(--violet-lt)" }}>moji</span>
        </button>

        <StepBar step={step} />

        <button
          onClick={() => navigate("/")}
          className="btn btn-ghost"
          style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12 }}
        >
          <HomeIcon size={13} /> Exit
        </button>
      </nav>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
        <AnimatePresence mode="wait">{steps[step - 1]}</AnimatePresence>
      </div>
    </div>
  );
}
