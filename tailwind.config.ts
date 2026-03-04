import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0a0a",
        ash: "#1a1a1a",
        card: "#111111",
        border: "#222222",
        signal: "#c8c8c8",
        secondary: "#888888",
        muted: "#666666",
        permit: "#44aa99",
        danger: "#EF4444",
        warning: "#F59E0B"
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(68,170,153,0.35), 0 0 30px rgba(68,170,153,0.2)",
        pulse: "0 0 40px rgba(68,170,153,0.35)"
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(68,170,153,0.3), 0 0 20px rgba(68,170,153,0.15)" },
          "50%": { boxShadow: "0 0 0 1px rgba(68,170,153,0.5), 0 0 36px rgba(68,170,153,0.35)" }
        },
        flowDash: {
          to: { strokeDashoffset: "-100" }
        }
      },
      animation: {
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        flowDash: "flowDash 3s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
