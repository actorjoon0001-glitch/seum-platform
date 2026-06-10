import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1e40af",
        },
        // 세움 플랫폼 브랜드 컬러 (그룹웨어 그린 톤)
        seum: {
          50: "#ecfdf3",
          100: "#d1fadf",
          200: "#a6f4c5",
          400: "#3aae5e",
          500: "#2f9e44",
          600: "#2b8a3e",
          700: "#237a36",
          DEFAULT: "#2f9e44",
          dark: "#2b8a3e",
          light: "#ecfdf3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
