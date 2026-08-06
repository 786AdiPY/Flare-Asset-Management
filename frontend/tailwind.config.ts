import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f14",
        panel: "#121821",
        border: "#232b36",
        accent: "#3ddc97",
        accent2: "#5b9dff",
        warn: "#f5a623",
        danger: "#ef5b5b",
      },
    },
  },
  plugins: [],
};

export default config;
