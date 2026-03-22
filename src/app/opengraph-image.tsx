import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TypeForge - AI-Powered Typing Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0f1e 0%, #0f1729 50%, #0d1225 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(34, 211, 238, 0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "100px",
            width: "500px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(168, 85, 247, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 32 32"
            fill="none"
          >
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="b1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <rect x="2" y="4" width="28" height="24" rx="6" stroke="url(#g1)" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M18 8L12 17H16L14 24L22 14H17L18 8Z" fill="url(#b1)" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "96px",
            fontWeight: 900,
            letterSpacing: "8px",
            fontFamily: "system-ui",
          }}
        >
          <span
            style={{
              background: "linear-gradient(90deg, #22d3ee, #3b82f6, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            TYPE
          </span>
          <span style={{ color: "#e2e8f0" }}>FORGE</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            color: "#64748b",
            marginTop: "12px",
            letterSpacing: "2px",
          }}
        >
          Forge your typing skills in the fires of competition
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
          }}
        >
          {["AI-Powered", "Real-time Races", "Combo System", "Leaderboards"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  padding: "8px 20px",
                  borderRadius: "100px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "16px",
                  letterSpacing: "1px",
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* Bottom typing demo mockup */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            gap: "4px",
            fontSize: "20px",
            fontFamily: "monospace",
          }}
        >
          {"the quick brown fox".split("").map((char, i) => (
            <span
              key={i}
              style={{
                color: i < 12 ? "#22d3ee" : "#1e293b",
                transition: "color 0.1s",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
          <span
            style={{
              borderLeft: "2px solid #22d3ee",
              marginLeft: "-2px",
              height: "24px",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
