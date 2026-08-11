import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0B0F12",
        ink: "#0B0F12",
        panel: "#13181D",
        border: "rgba(244, 241, 234, 0.1)",
        accent: "#B2C8BA",         // Muted Sage primary accent
        accent2: "#F4F1EA",        // Warm Ivory primary text
        accent3: "#87A998",        // Deep Sage
        sage: "#B2C8BA",           // Muted Sage
        ivory: "#F4F1EA",          // Warm Ivory
        amber: "#D9AC62",          // Warm Amber
        brand: "#3f49e1",          // Blue/violet lightning mark brand logo
        success: "#87A96B",        // Live / Verified muted green
        warn: "#D9AC62",           // Warm Amber warnings / risk
        danger: "#E07A5F",         // Error / High Risk coral red
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(178, 200, 186, 0.25)",
        glass: "0 8px 32px -8px rgba(0, 0, 0, 0.6)",
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(.44, 0, .56, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
