/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#E07800",
          accent: "#FFB627",
          "primary-hover": "#C96A00",
          "accent-hover": "#E5A220",
        },
        dark: {
          bg: "#141414",
          surface: "#1E1E1E",
          elevated: "#2A2A2A",
          border: "#3A3A3A",
        },
        light: {
          bg: "#FAFAF8",
          surface: "#F0EDE5",
          elevated: "#FFFFFF",
          border: "#D8D4CA",
        },
      },
      fontFamily: {
        heading: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
      },
      borderRadius: {
        brand: "8px",
        "brand-lg": "12px",
        "brand-xl": "16px",
      },
    },
  },
};
