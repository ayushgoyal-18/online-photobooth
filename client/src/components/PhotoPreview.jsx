import { motion } from "framer-motion";
import { RotateCcw, Check } from "lucide-react";

export default function PhotoPreview({ photo, currentPhoto, onRetake, onContinue }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(9,9,16,0.94)",
        backdropFilter: "blur(14px)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 18 }}
        className="card"
        style={{ padding: 28, maxWidth: 580, width: "100%" }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              fontSize: 12,
              color: "var(--violet-lt)",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Shot #{currentPhoto}
          </div>
          <h2
            id="preview-title"
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "var(--cream)",
            }}
          >
            Looking good?
          </h2>
        </div>

        <img
          src={photo}
          alt={`Captured shot ${currentPhoto}`}
          className="anim-polaroid"
          style={{
            width: "100%",
            borderRadius: 14,
            display: "block",
            border: "2px solid var(--border)",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onRetake}
            className="btn"
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#FCA5A5",
              fontSize: 15,
              gap: 6,
            }}
          >
            <RotateCcw size={14} /> Retake
          </button>
          <button
            onClick={onContinue}
            className="btn"
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 12,
              background: "linear-gradient(135deg, #22C55E, #16A34A)",
              border: "none",
              color: "white",
              fontSize: 15,
              gap: 6,
            }}
          >
            <Check size={14} /> Use this photo
          </button>
        </div>
      </motion.div>
    </div>
  );
}