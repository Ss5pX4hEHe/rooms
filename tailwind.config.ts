import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-h": "var(--surface-h)",
        pri: "var(--pri)",
        "pri-h": "var(--pri-h)",
        tx: "var(--tx)",
        tx2: "var(--tx2)",
        brd: "var(--brd)",
        "bub-own": "var(--bub-own)",
        "bub-other": "var(--bub-other)",
      },
    },
  },
  plugins: [],
};
export default config;
