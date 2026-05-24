import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      colors: {
        ink: "#101318",
        paper: "#F7F4EF",
        slate: "#5C6675",
        cloud: "#E5E7EB",
        coral: "#FF6B5A",
        amber: "#F4B740",
        teal: "#23B8A9",
        sky: "#5B8DEF"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(16, 19, 24, 0.08)"
      },
      backgroundImage: {
        "topographic-lines":
          "radial-gradient(circle at 20% 20%, rgba(91, 141, 239, 0.12) 0, rgba(91, 141, 239, 0.12) 1px, transparent 1px), radial-gradient(circle at 80% 40%, rgba(255, 107, 90, 0.08) 0, rgba(255, 107, 90, 0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))"
      }
    }
  },
  plugins: []
};

export default config;
