import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06092f",
        surface: "#06092f",
        "surface-container-low": "#090e38",
        "surface-container": "#0f1442",
        "surface-container-high": "#141a4c",
        "surface-container-highest": "#1a2056",
        "on-background": "#e3e3ff",
        "on-surface": "#e3e3ff",
        "on-surface-variant": "#a4a8d5",
        primary: "#89acff",
        "primary-container": "#739eff",
        "secondary": "#a289ff",
        "secondary-container": "#591adc",
        tertiary: "#b5ffc2",
        error: "#ff716c",
        "outline-variant": "#41456c",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-manrope)", "sans-serif"],
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #89acff 0%, #739eff 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
