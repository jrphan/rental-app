/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // HSL Color System
        primary: {
          50: "hsl(18, 100%, 97%)",
          100: "hsl(18, 100%, 92%)",
          200: "hsl(16, 95%, 85%)",
          300: "hsl(16, 94%, 74%)",
          400: "hsl(15, 90%, 64%)",
          500: "hsl(14, 85%, 55%)", // Shopee Orange
          600: "hsl(14, 85%, 48%)",
          700: "hsl(14, 85%, 40%)",
          800: "hsl(14, 85%, 35%)",
          900: "hsl(14, 85%, 30%)",
          950: "hsl(14, 90%, 20%)",
        },
        // Secondary colors
        secondary: {
          50: "hsl(210, 20%, 98%)",
          100: "hsl(210, 20%, 95%)",
          200: "hsl(210, 20%, 90%)",
          300: "hsl(210, 20%, 80%)",
          400: "hsl(210, 20%, 70%)",
          500: "hsl(210, 20%, 60%)",
          600: "hsl(210, 20%, 50%)",
          700: "hsl(210, 20%, 40%)",
          800: "hsl(210, 20%, 30%)",
          900: "hsl(210, 20%, 20%)",
          950: "hsl(210, 20%, 10%)",
        },
        // Accent colors
        accent: {
          50: "hsl(142, 76%, 95%)",
          100: "hsl(142, 76%, 90%)",
          200: "hsl(142, 76%, 80%)",
          300: "hsl(142, 76%, 70%)",
          400: "hsl(142, 76%, 60%)",
          500: "hsl(142, 76%, 50%)",
          600: "hsl(142, 76%, 45%)",
          700: "hsl(142, 76%, 40%)",
          800: "hsl(142, 76%, 35%)",
          900: "hsl(142, 76%, 30%)",
          950: "hsl(142, 76%, 20%)",
        },
        // Destructive colors
        destructive: {
          50: "hsl(0, 86%, 95%)",
          100: "hsl(0, 86%, 90%)",
          200: "hsl(0, 86%, 80%)",
          300: "hsl(0, 86%, 70%)",
          400: "hsl(0, 86%, 60%)",
          500: "hsl(0, 86%, 50%)",
          600: "hsl(0, 86%, 45%)",
          700: "hsl(0, 86%, 40%)",
          800: "hsl(0, 86%, 35%)",
          900: "hsl(0, 86%, 30%)",
          950: "hsl(0, 86%, 20%)",
        },
        // Neutral colors
        neutral: {
          50: "hsl(0, 0%, 98%)",
          100: "hsl(0, 0%, 95%)",
          200: "hsl(0, 0%, 90%)",
          300: "hsl(0, 0%, 80%)",
          400: "hsl(0, 0%, 70%)",
          500: "hsl(0, 0%, 60%)",
          600: "hsl(0, 0%, 50%)",
          700: "hsl(0, 0%, 40%)",
          800: "hsl(0, 0%, 30%)",
          900: "hsl(0, 0%, 20%)",
          950: "hsl(0, 0%, 10%)",
        },
      },
      // Custom spacing scale
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      // Custom border radius
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      // Custom shadows
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        hard: "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
