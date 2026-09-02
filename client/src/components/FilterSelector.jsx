const FILTERS = [
  { label: "Original",  value: "original",  emoji: "🌈" },
  { label: "B&W",       value: "grayscale", emoji: "⬛" },
  { label: "Vintage",   value: "sepia",     emoji: "🟫" },
  { label: "Warm",      value: "warm",      emoji: "🔆" },
  { label: "Cool",      value: "cool",      emoji: "🩵" },
  { label: "Dreamy",    value: "dreamy",    emoji: "🌸" },
  { label: "Cinematic", value: "cinematic", emoji: "🎬" },
  { label: "Neon",      value: "neon",      emoji: "💜" },
];

export default function FilterSelector({ selectedFilter, setSelectedFilter }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
        marginBottom: 24,
      }}
    >
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => setSelectedFilter(f.value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            borderRadius: 99,
            cursor: "pointer",
            background:
              selectedFilter === f.value
                ? "rgba(124,58,237,0.18)"
                : "rgba(255,255,255,0.04)",
            border: `1.5px solid ${
              selectedFilter === f.value ? "var(--violet)" : "var(--border)"
            }`,
            color:
              selectedFilter === f.value ? "var(--mauve)" : "var(--text-sub)",
            fontWeight: 600,
            fontSize: 13,
            transition: "all 0.18s",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          <span style={{ fontSize: 14 }}>{f.emoji}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}