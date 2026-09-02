const FILTER_CSS = {
  original: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(90%)",
  warm: "saturate(130%) hue-rotate(-15deg) brightness(1.05)",
  cool: "saturate(110%) hue-rotate(22deg) brightness(1.03)",
  dreamy: "saturate(75%) brightness(1.12) contrast(0.9)",
  cinematic: "contrast(1.1) saturate(85%) brightness(0.95)",
  neon: "saturate(180%) hue-rotate(-30deg) contrast(1.1)",
};

const THEMES = {
  solo: { bg: "#FFFFFF", accent: "#7C3AED", photoBorder: "#EDE9FE", nameColor: "#1E1B4B" },
  couple: { bg: "#FFF0F6", accent: "#BE123C", photoBorder: "#FCE7F3", nameColor: "#881337" },
  friends: { bg: "#F5F3FF", accent: "#6D28D9", photoBorder: "#DDD6FE", nameColor: "#4C1D95" },
  birthday: { bg: "#FFFBEB", accent: "#B45309", photoBorder: "#FDE68A", nameColor: "#78350F" },
  family: { bg: "#F0FDF4", accent: "#15803D", photoBorder: "#BBF7D0", nameColor: "#14532D" },
  party: { bg: "#FFF7ED", accent: "#C2410C", photoBorder: "#FED7AA", nameColor: "#7C2D12" },
  pastel: { bg: "#FDF2F8", accent: "#EC4899", photoBorder: "#FBCFE8", nameColor: "#831843" },
  y2k: { bg: "#EEF2FF", accent: "#4F46E5", photoBorder: "#C7D2FE", nameColor: "#312E81" },
  matcha: { bg: "#F0FDF4", accent: "#16A34A", photoBorder: "#DCFCE7", nameColor: "#14532D" },
  charcoal: { bg: "#18181B", accent: "#A1A1AA", photoBorder: "#27272A", nameColor: "#FAFAFA" },
};

const ROTATIONS = [-1.8, 1.4, -1.2, 1.6, -0.8, 1.2];

export default function Photostrip({
  photos = [],
  participant1 = "",
  participant2 = "",
  allNames = "",
  theme = "friends",
  layout = "classic",
  selectedFilter = "original",
  caption = "",
}) {
  const t = THEMES[theme] || THEMES.friends;
  const flt = FILTER_CSS[selectedFilter] || "none";
  const displayName = allNames || (participant2 ? `${participant1} × ${participant2}` : participant1);
  const dateLine = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const isMulti = theme === "couple" || theme === "friends" || Boolean(participant2) || Boolean(allNames);

  if (layout === "classic")
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          id="photostrip"
          style={{
            background: t.bg,
            width: isMulti ? 440 : 240,
            padding: "14px 14px 24px",
            borderRadius: 8,
            boxShadow: "0 6px 0 rgba(0,0,0,0.15), 0 28px 60px rgba(0,0,0,0.48)",
          }}
        >
          {photos.map((p, i) => (
            <div key={i} style={{ marginBottom: i < photos.length - 1 ? 7 : 0 }}>
              <img
                src={p}
                alt=""
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: 4,
                  border: `2px solid ${t.photoBorder}`,
                  filter: flt,
                }}
              />
            </div>
          ))}
          <div style={{ marginTop: 12, textAlign: "center" }}>
            {displayName && (
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: t.nameColor || "#1a1a1a",
                  marginBottom: 3,
                }}
              >
                {displayName}
              </div>
            )}
            {caption && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: t.accent,
                  fontFamily: "Georgia, serif",
                  marginBottom: 4,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                "{caption}"
              </div>
            )}
            <div style={{ fontSize: 9, color: t.nameColor === "#FAFAFA" ? "#71717A" : "#9CA3AF" }}>
              {dateLine}
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              textAlign: "center",
              fontSize: 7,
              color: t.nameColor === "#FAFAFA" ? "#52525B" : "#D1D5DB",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            framoji.app
          </div>
        </div>
      </div>
    );

  if (layout === "polaroid")
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          id="photostrip"
          style={{
            background: "#F5EFE6",
            width: isMulti ? 460 : 260,
            padding: "18px 14px 24px",
            borderRadius: 6,
            boxShadow: "0 5px 0 #c8b89a, 0 24px 58px rgba(0,0,0,0.42)",
          }}
        >
          {photos.map((p, i) => {
            const rot = ROTATIONS[i % ROTATIONS.length];
            return (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  padding: "8px 8px 42px",
                  marginBottom: i < photos.length - 1 ? 14 : 0,
                  transform: `rotate(${rot}deg)`,
                  boxShadow:
                    "0 4px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)",
                  position: "relative",
                  borderRadius: 2,
                }}
              >
                <img
                  src={p}
                  alt=""
                  style={{ width: "100%", display: "block", filter: flt }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 8px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: i === 0 ? 12 : 11,
                      color: "#444",
                      textAlign: "center",
                      letterSpacing: "0.03em",
                      fontWeight: 600,
                    }}
                  >
                    {i === 0 && displayName
                      ? displayName
                      : i === photos.length - 1
                      ? dateLine
                      : caption && i === 1
                      ? `"${caption}"`
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div
              style={{
                fontSize: 7,
                color: "#A09070",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              framoji.app
            </div>
          </div>
        </div>
      </div>
    );

  if (layout === "retro")
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          id="photostrip"
          style={{
            background: "#241A0C",
            width: isMulti ? 456 : 256,
            padding: "5px 19px 12px",
            borderRadius: 4,
            boxShadow:
              "0 0 0 2px #150F06, 0 26px 64px rgba(0,0,0,0.65)",
            position: "relative",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {["left", "right"].map((side) => (
            <div
              key={side}
              style={{
                position: "absolute",
                [side]: 2,
                top: 0,
                bottom: 0,
                width: 12,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
                padding: "7px 0",
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 1,
                    background: "#150F06",
                    border: "1px solid #352A18",
                    margin: "0 auto",
                  }}
                />
              ))}
            </div>
          ))}
          <div
            style={{
              textAlign: "center",
              padding: "6px 0 4px",
              borderBottom: "1px solid #352A18",
              marginBottom: 5,
            }}
          >
            <div
              style={{
                fontSize: 6,
                color: "#A07820",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              FRAMOJI · {theme.toUpperCase()} · {new Date().getFullYear()}
            </div>
          </div>
          {photos.map((p, i) => (
            <div key={i} style={{ marginBottom: 5 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                  fontSize: 6,
                  color: "#7A5C1A",
                  letterSpacing: "0.1em",
                }}
              >
                <span>◀ {String(i + 1).padStart(2, "0")} ▶</span>
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                  })}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <img
                  src={p}
                  alt=""
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: 1,
                    filter:
                      flt === "none"
                        ? "sepia(14%) contrast(1.04)"
                        : `${flt} sepia(14%) contrast(1.04)`,
                    border: "2px solid #150F06",
                  }}
                />
              </div>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid #352A18",
              paddingTop: 5,
              marginTop: 2,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 6, color: "#A07820", fontWeight: 700 }}>
                {displayName}
              </span>
              <span style={{ fontSize: 6, color: "#7A5C1A" }}>FRAMOJI.APP</span>
            </div>
            {caption && (
              <div
                style={{
                  fontSize: 8.5,
                  color: "#C89A30",
                  marginTop: 2,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                "{caption}"
              </div>
            )}
          </div>
        </div>
      </div>
    );

  return null;
}