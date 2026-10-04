
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      colors: {
        brand: {
          deep: "#0E1A36",     // evening ink
          navy: "#16264A",     // deep indigo-navy
          ink: "#141F38",      // body ink on cream
          royal: "#2456C4",    // royal blue, deepened for cream contrast
          blue: "#3b82f6",     // bright blue
          feather: "#8FB4F5",  // soft blue tint
          ocean: "#0ea5e9",    // ocean blue
          sky: "#E4F0FE",      // pale sky, for text on evening panels
          cream: "#FAF5EA",    // page ground
          paper: "#FFFDF7",    // card ground
          sand: "#F1E6CF",     // secondary surfaces
          sandline: "#E2D3B4", // borders on sand
          gold: "#C39A3B",     // antique brass
          golddeep: "#7C611D", // brass text on cream
          clay: "#C26A3D",     // terracotta spark, decorative use only
          accent: "#D99A2B"    // warm gold accent
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          border: "hsl(var(--surface-border))"
        }
      },
      boxShadow: {
        glow: "0 0 120px rgba(14, 165, 233, 0.15)",
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
        warm: "0 1px 2px rgba(20, 31, 56, 0.05), 0 12px 32px -12px rgba(20, 31, 56, 0.22)",
        lift: "0 2px 4px rgba(20, 31, 56, 0.06), 0 20px 44px -16px rgba(20, 31, 56, 0.3)",
        "gold-glow": "0 0 44px rgba(195, 154, 59, 0.25)"
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at top, rgba(14, 165, 233, 0.15), transparent 50%), radial-gradient(circle at bottom right, rgba(212, 175, 55, 0.1), transparent 40%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))",
        dawn: "radial-gradient(60% 50% at 50% 0%, rgba(195, 154, 59, 0.16), transparent 70%), radial-gradient(50% 40% at 85% 20%, rgba(36, 86, 196, 0.1), transparent 70%)"
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
        expo: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "pop-in": "pop-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both"
      }
    }
  },
  plugins: []
};

export default config;
