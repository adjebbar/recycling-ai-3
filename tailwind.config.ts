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
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Added new orange color
        orange: {
          DEFAULT: "hsl(27 87% 67%)", // A vibrant orange
          foreground: "hsl(24 9.8% 10%)", // Dark text for contrast
        },
        // New colors for the landing page design
        'landing-green': {
          lighter: 'hsl(140, 60%, 50%)', // Lighter green for gradient start
          DEFAULT: 'hsl(140, 60%, 40%)', // Default green
          darker: 'hsl(140, 60%, 30%)', // Darker green for gradient end
        },
        'bin-red': {
          DEFAULT: 'hsl(350, 70%, 60%)', // Vibrant pinkish red for the bin
          foreground: 'hsl(0, 0%, 100%)', // White text for bin
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "from": { opacity: "0", transform: "translateY(10px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "point-burst": {
          "0%": { transform: "scale(0.5) translateY(10px)", opacity: "0" },
          "50%": { transform: "scale(1.1) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "pulse-once": {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        "subtle-pulse": {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        "color-pulse": {
          "0%, 100%": { backgroundColor: "hsl(var(--primary))" },
          "50%": { backgroundColor: "hsl(var(--orange))" },
        },
        "bin-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        "scan-beam-active": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "50%": { transform: "scaleX(1)", opacity: "1" },
          "100%": { transform: "scaleX(0)", opacity: "0" },
        },
        "scan-line-sweep": {
          "0%": { top: '20%' },
          "50%": { top: '80%' },
          "100%": { top: '20%' },
        },
        "glow-pulse": {
          "0%, 100%": { filter: "drop-shadow(0 0 5px hsl(var(--primary)))" },
          "50%": { filter: "drop-shadow(0 0 15px hsl(var(--primary)))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "point-burst": "point-burst 0.5s ease-out forwards",
        "pulse-once": "pulse-once 0.5s ease-in-out",
        "subtle-pulse": "subtle-pulse 2s ease-in-out infinite",
        "color-pulse": "color-pulse 3s ease-in-out infinite",
        "bin-shake": "bin-shake 0.3s ease-in-out",
        "scan-beam-active": "scan-beam-active 1.5s ease-in-out",
        "scan-line-sweep": "scan-line-sweep 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;