import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0E7490",
          hover: "#0891B2",
          dark: "#155E75",
          light: "#E0F2FE",
        },
        calm: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
        },
        status: {
          green: "#16A34A",
          greenBg: "#DCFCE7",
          amber: "#F59E0B",
          amberBg: "#FEF3C7",
          red: "#DC2626",
          redBg: "#FEE2E2",
          sky: "#0284C7",
          skyBg: "#E0F2FE",
        }
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Devanagari", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(14, 116, 144, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.03)",
        elevated: "0 10px 25px -5px rgba(14, 116, 144, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      }
    },
  },
  plugins: [],
};

export default config;
