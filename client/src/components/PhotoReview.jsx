import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";

export default function PhotoReview({ photos, onRetakePhoto, onContinue, isReadOnly = false }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(9,9,16,0.96)",
        backdropFilter: "blur(14px)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: 32, maxWidth: 860, width: "100%" }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎞️</div>
          <h2
            id="review-title"
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: "var(--cream)",
              marginBottom: 8,
            }}
          >
            Review your shots
          </h2>
          <p style={{ color: "var(--text-sub)", fontSize: 14 }}>
            {isReadOnly
              ? "The host is reviewing the shots. You'll see the final strip when it's ready."
              : "Click any photo to retake it. Happy with all of them? Generate your strip!"}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {photos.map((photo, i) => (
            <motion.button
              key={i}
              type="button"
              whileHover={{ scale: 1.03 }}
              disabled={isReadOnly}
              aria-label={isReadOnly ? `Shot ${i + 1}` : `Retake photo ${i + 1}`}
              style={{
                position: "relative",
                cursor: isReadOnly ? "default" : "pointer",
                borderRadius: 14,
                overflow: "hidden",
                border: "none",
                padding: 0,
                background: "transparent",
                textAlign: "left",
                display: "block",
                width: "100%",
              }}
              onClick={() => !isReadOnly && onRetakePhoto?.(i)}
            >
              <img
                src={photo}
                alt={`Captured shot ${i + 1}`}
                style={{ width: "100%", display: "block" }}
              />
              {!isReadOnly && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(9,9,16,0.6)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <RotateCcw size={22} color="white" />
                  <span
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Retake
                  </span>
                </motion.div>
              )}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "rgba(9,9,16,0.75)",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                #{i + 1}
              </div>
            </motion.button>
          ))}
        </div>

        {isReadOnly ? (
          <div style={{ textAlign: "center", color: "var(--text-sub)", fontSize: 13 }}>
            Waiting for the host to generate the photostrip…
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onContinue}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: 16,
              fontSize: 16,
              borderRadius: 16,
              gap: 8,
            }}
          >
            <Sparkles size={16} /> Generate My Photostrip
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
