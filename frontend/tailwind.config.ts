import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090c",
        panel: "#121217",
        border: "rgba(255, 255, 255, 0.1)",
        accent: "#3f49e1",
        accent2: "#f5b5ff",
        accent3: "#0000ee",
        cyan: "#0099ff",
        success: "#4ef263",
        warn: "#ffdc42",
        danger: "#eb3131",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(63, 73, 225, 0.4)",
        glass: "0 8px 32px -8px rgba(0, 0, 0, 0.5)",
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(.44, 0, .56, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
