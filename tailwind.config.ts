import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F1EC",
        "paper-dim": "#E9E6DD",
        ink: "#1B1A17",
        "ink-soft": "#4A4740",
        stone: "#DAD4C6",
        moss: "#4B5940",
        "moss-soft": "#6C7A5F",
        clay: "#A9552F",
        night: "#17181A",
        "night-panel": "#1F2022",
        "night-ink": "#EDEAE2"
      },
      fontFamily: {
        sans: ["var(--font-plex)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px"
      }
    }
  },
  plugins: []
};

export default config;
