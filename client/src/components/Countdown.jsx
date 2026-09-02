import { motion, AnimatePresence } from "framer-motion";

export default function Countdown({ countdown }) {
  if (!countdown) return null;

  const isSnap = countdown === "📸";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(9,9,16,0.88)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isSnap && (
        <motion.div
          key={`ring-${countdown}`}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: "3px solid rgba(167,139,250,0.5)",
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={countdown}
          initial={{ scale: 0.3, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.5, opacity: 0, y: -20 }}
          transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: isSnap ? 90 : 148,
            lineHeight: 1,
            color: isSnap ? "#fff" : "var(--mauve)",
            textShadow: isSnap ? "none" : "0 0 80px rgba(196,181,253,0.5)",
          }}
        >
          {countdown}
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          color: "var(--text-sub)",
          fontSize: 14,
          marginTop: 28,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {isSnap ? "Got it! ✓" : "Get ready…"}
      </motion.p>
    </div>
  );
}