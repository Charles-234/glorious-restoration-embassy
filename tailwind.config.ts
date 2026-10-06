
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class', '.dark'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      colors: {
        brand: {
          deep: "#091426",
          navy: "#091426",
          ink: "#1c1c18",
          royal: "#091426",
          blue: "#ac3400",
          feather: "#ffb59d",
          ocean: "#fd6b36",
          sky: "#f6f3ec",
          cream: "#fcf9f2",
          paper: "#ffffff",
          sand: "#f1eee7",
          sandline: "#d8d3ca",
          gold: "#ac3400",
          golddeep: "#832600",
          clay: "#ac3400",
          accent: "#fd6b36",
          olive: "#0a1800",
          oliveLight: "#6c9d31"
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
        glow: "0 0 120px rgba(172, 52, 0, 0.12)",
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
        warm: "0 1px 2px rgba(9, 20, 38, 0.05), 0 12px 32px -12px rgba(9, 20, 38, 0.16)",
        lift: "0 2px 4px rgba(9, 20, 38, 0.06), 0 20px 44px -16px rgba(9, 20, 38, 0.22)",
        "gold-glow": "0 0 44px rgba(172, 52, 0, 0.2)"
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at 15% 10%, rgba(253, 107, 54, 0.10), transparent 38%), radial-gradient(circle at 90% 75%, rgba(10, 24, 0, 0.07), transparent 38%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))",
        dawn: "radial-gradient(60% 50% at 50% 0%, rgba(253, 107, 54, 0.12), transparent 70%), radial-gradient(50% 40% at 85% 20%, rgba(10, 24, 0, 0.08), transparent 70%)"
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

