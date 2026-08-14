import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 現行サイトの雰囲気に合わせて後で調整
        base: "#0f0f0f",
        accent: "#ff7a1a",
      },
    },
  },
  plugins: [],
} satisfies Config;
