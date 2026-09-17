import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          bg: {
            primary: "#05070B",
            secondary: "#0A0F16",
            panel: "#0D141D",
            elevated: "#111927",
          },
          border: {
            DEFAULT: "#1B2835",
            light: "#243447",
            focus: "#2E4258",
          },
          cyan: {
            DEFAULT: "#00E5FF",
            dim: "#00B8CC",
            glow: "#00E5FF33",
            muted: "#00E5FF1A",
          },
          green: {
            DEFAULT: "#39FF88",
            dim: "#2BCC6B",
            glow: "#39FF8833",
          },
          yellow: {
            DEFAULT: "#FFD166",
            dim: "#CCA752",
            glow: "#FFD16633",
          },
          red: {
            DEFAULT: "#FF3B5C",
            dim: "#CC2F4A",
            glow: "#FF3B5C33",
            bright: "#FF4D6A",
          },
          purple: {
            DEFAULT: "#B56CFF",
            dim: "#9156CC",
            glow: "#B56CFF33",
          },
          text: {
            primary: "#E8EDF3",
            secondary: "#8899AA",
            tertiary: "#5A6B7C",
            muted: "#3D4E5F",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 229, 255, 0.15)",
        "glow-green": "0 0 20px rgba(57, 255, 136, 0.15)",
        "glow-yellow": "0 0 20px rgba(255, 209, 102, 0.15)",
        "glow-red": "0 0 20px rgba(255, 59, 92, 0.15)",
        "glow-purple": "0 0 20px rgba(181, 108, 255, 0.15)",
        "panel": "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
