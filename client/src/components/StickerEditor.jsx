import { useState } from "react";
import { Trash2, Plus, Minus, Move, RotateCw, RotateCcw } from "lucide-react";

const STICKER_SETS = [
  {
    label: "Hearts & Love",
    icon: "❤️",
    emojis: ["❤️", "💖", "💕", "💞", "💓", "💗", "💘", "💝", "🤍", "💜", "🩷", "🫶"],
  },
  {
    label: "Reactions & Laughs",
    icon: "😂",
    emojis: ["😂", "🤣", "🥹", "😍", "😘", "😜", "🥳", "😎", "🤩", "🙈", "💀", "😭"],
  },
  {
    label: "Props & Accessories",
    icon: "🕶️",
    emojis: ["🕶️", "👓", "👑", "🎩", "🧢", "🎀", "💄", "💋", "🍿", "🍸", "🪄", "🪞"],
  },
  {
    label: "Sparkles & Vibe",
    icon: "✨",
    emojis: ["✨", "⭐", "🌟", "💫", "⚡", "🔥", "🌈", "☁️", "🌸", "🌷", "🍒", "🍓"],
  },
  {
    label: "Party & Celebrate",
    icon: "🎉",
    emojis: ["🎉", "🎊", "🎈", "🎁", "🍾", "🥂", "🍰", "🎶", "🎵", "🏆", "📸", "🎞️"],
  },
];

export default function StickerEditor({
  stickers,
  setStickers,
  selectedStickerId,
  setSelectedStickerId,
}) {
  const [activeSet, setActiveSet] = useState(0);

  const addSticker = (emoji) => {
    const newId = Date.now();
    setStickers((prev) => [
      ...prev,
      {
        id: newId,
        emoji,
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 140,
        size: 34,
        rotate: 0,
      },
    ]);
    setSelectedStickerId(newId);
  };

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);

  const updateSize = (delta) => {
    if (!selectedStickerId) return;
    setStickers((prev) =>
      prev.map((s) =>
        s.id === selectedStickerId
          ? { ...s, size: Math.max(16, Math.min(84, (s.size || 34) + delta)) }
          : s
      )
    );
  };

  const updateRotation = (degDelta) => {
    if (!selectedStickerId) return;
    setStickers((prev) =>
      prev.map((s) =>
        s.id === selectedStickerId
          ? { ...s, rotate: ((s.rotate || 0) + degDelta + 360) % 360 }
          : s
      )
    );
  };

  const removeSelected = () => {
    if (!selectedStickerId) return;
    setStickers((prev) => prev.filter((s) => s.id !== selectedStickerId));
    setSelectedStickerId(null);
  };

  return (
    <div style={{ maxWidth: 300, margin: "0 auto 20px" }}>
      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-sub)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🎀</span> Photobooth Stickers
          </span>
          {stickers.length > 0 && (
            <button
              onClick={() => {
                setStickers([]);
                setSelectedStickerId(null);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#F87171",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <Trash2 size={11} /> Clear all
            </button>
          )}
        </div>

        {/* Sticker Category Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
          {STICKER_SETS.map((set, i) => (
            <button
              key={i}
              onClick={() => setActiveSet(i)}
              style={{
                flex: "0 0 auto",
                padding: "6px 9px",
                borderRadius: 8,
                cursor: "pointer",
                background:
                  activeSet === i ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  activeSet === i ? "var(--violet)" : "var(--border)"
                }`,
                color:
                  activeSet === i ? "var(--mauve)" : "var(--text-sub)",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                fontFamily: "DM Sans, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{set.icon}</span> {set.label}
            </button>
          ))}
        </div>

        {/* Sticker Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {STICKER_SETS[activeSet].emojis.map((em) => (
            <button
              key={em}
              onClick={() => addSticker(em)}
              style={{
                padding: "8px 0",
                borderRadius: 10,
                cursor: "pointer",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                fontSize: 19,
                transition: "transform 0.15s, background 0.15s",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
                e.currentTarget.style.background = "rgba(124,58,237,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              {em}
            </button>
          ))}
        </div>

        {/* Sticker Controls when a sticker is selected */}
        {selectedSticker && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 20 }}>{selectedSticker.emoji}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  onClick={() => updateSize(-4)}
                  className="btn btn-ghost"
                  style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}
                  title="Smaller"
                >
                  <Minus size={12} />
                </button>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mauve)",
                    minWidth: 32,
                    textAlign: "center",
                  }}
                >
                  {selectedSticker.size || 34}px
                </span>
                <button
                  onClick={() => updateSize(4)}
                  className="btn btn-ghost"
                  style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}
                  title="Bigger"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={removeSelected}
                  className="btn"
                  style={{
                    width: 26,
                    height: 26,
                    padding: 0,
                    borderRadius: 6,
                    background: "rgba(239,68,68,0.18)",
                    color: "#FCA5A5",
                    marginLeft: 4,
                  }}
                  title="Delete sticker"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-sub)" }}>Rotate</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  onClick={() => updateRotation(-15)}
                  className="btn btn-ghost"
                  style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}
                  title="Rotate Left"
                >
                  <RotateCcw size={11} />
                </button>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mauve)", minWidth: 32, textAlign: "center" }}>
                  {selectedSticker.rotate || 0}°
                </span>
                <button
                  onClick={() => updateRotation(15)}
                  className="btn btn-ghost"
                  style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}
                  title="Rotate Right"
                >
                  <RotateCw size={11} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: 11,
            color: "var(--text-sub)",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Move size={11} color="var(--violet-lt)" /> Drag stickers to place on your photostrip
        </div>
      </div>
    </div>
  );
}