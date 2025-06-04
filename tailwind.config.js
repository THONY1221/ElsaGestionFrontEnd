/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        sm: "576px",
        md: "768px",
        lg: "992px",
        xl: "1200px",
      },
      spacing: {
        xs: "0.25rem", // 4px
        sm: "0.5rem", // 8px
        md: "1rem", // 16px
        lg: "1.5rem", // 24px
        xl: "2rem", // 32px
      },
      colors: {
        primary: {
          DEFAULT: "#1a56db",
          dark: "#1e429f",
        },
        // ELSA GESTION Palette
        "blue-900": "var(--blue-900)", // #1F3B5A
        "blue-700": "var(--blue-700)", // #295D86 (bleu logo ELSA)
        "blue-500": "var(--blue-500)", // #4088B8
        "blue-100": "var(--blue-100)", // #D6E6F4
        "red-900": "var(--red-900)", // #7C1214
        "red-700": "var(--red-700)", // #BE4349 (rouge logo GESTION)
        "red-500": "var(--red-500)", // #F32322
        "red-100": "var(--red-100)", // #FFD8D8
        "grey-900": "var(--grey-900)", // #121212
        "grey-700": "var(--grey-700)", // #35303E
        "grey-100": "var(--grey-100)", // #F5F5F5
      },
      backgroundImage: {
        "brand-gradient": "var(--brand-gradient)",
      },
    },
  },
  plugins: [],
};
