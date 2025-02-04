import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
          light: "#A78BFA",
          dark: "#7C3AED",
        },
        secondary: {
          DEFAULT: "#1A1B1E",
          foreground: "#FFFFFF",
          light: "#2C2D31",
          dark: "#18191C",
        },
        accent: {
          DEFAULT: "#312E81",
          foreground: "#E0E7FF",
        },
        destructive: {
          DEFAULT: "#7f1d1d",
          foreground: "#FEE2E2",
        },
        muted: {
          DEFAULT: "#2C2D31",
          foreground: "#9CA3AF",
        },
        popover: {
          DEFAULT: "#1A1B1E",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1A1B1E",
          foreground: "#FFFFFF",
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #1A1B1E 0%, #2C2D31 100%)',
        'gradient-accent': 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;