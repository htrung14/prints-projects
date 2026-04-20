/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "hsl(NaN, NaN%, 97%)",
          100: "hsl(NaN, NaN%, 94%)",
          200: "hsl(NaN, NaN%, 86%)",
          300: "hsl(NaN, NaN%, 76%)",
          400: "hsl(NaN, NaN%, 64%)",
          500: "hsl(NaN, NaN%, 50%)",
          600: "hsl(NaN, NaN%, 40%)",
          700: "hsl(NaN, NaN%, 32%)",
          800: "hsl(NaN, NaN%, 24%)",
          900: "hsl(NaN, NaN%, 16%)",
          950: "hsl(NaN, NaN%, 10%)",
          DEFAULT: "#100a0d",
        },
        secondary: {
          50: "hsl(NaN, NaN%, 97%)",
          100: "hsl(NaN, NaN%, 94%)",
          200: "hsl(NaN, NaN%, 86%)",
          300: "hsl(NaN, NaN%, 76%)",
          400: "hsl(NaN, NaN%, 64%)",
          500: "hsl(NaN, NaN%, 50%)",
          600: "hsl(NaN, NaN%, 40%)",
          700: "hsl(NaN, NaN%, 32%)",
          800: "hsl(NaN, NaN%, 24%)",
          900: "hsl(NaN, NaN%, 16%)",
          950: "hsl(NaN, NaN%, 10%)",
          DEFAULT: "#fdfbf9",
        },
        accent: {
          50: "hsl(NaN, NaN%, 97%)",
          100: "hsl(NaN, NaN%, 94%)",
          200: "hsl(NaN, NaN%, 86%)",
          300: "hsl(NaN, NaN%, 76%)",
          400: "hsl(NaN, NaN%, 64%)",
          500: "hsl(NaN, NaN%, 50%)",
          600: "hsl(NaN, NaN%, 40%)",
          700: "hsl(NaN, NaN%, 32%)",
          800: "hsl(NaN, NaN%, 24%)",
          900: "hsl(NaN, NaN%, 16%)",
          950: "hsl(NaN, NaN%, 10%)",
          DEFAULT: "#fdfbf9",
        },
        "neutral-50": "#000000",
        "neutral-100": "#77716e",
        "neutral-200": "#383d41",
        "neutral-300": "#333333",
        "neutral-400": "#e5e5e5",
        "neutral-500": "#242121",
        background: "#fdfbf9",
        foreground: "#000000",
      },
      fontFamily: {
        sans: ["BrownStd", "sans-serif"],
        body: ["GTStandard-M", "sans-serif"],
      },
      fontSize: {
        10: [
          "10px",
          {
            lineHeight: "normal",
          },
        ],
        11: [
          "11px",
          {
            lineHeight: "13.2px",
            letterSpacing: "0.7px",
          },
        ],
        12: [
          "12px",
          {
            lineHeight: "30px",
          },
        ],
        13: [
          "13px",
          {
            lineHeight: "19.5px",
            letterSpacing: "0.4px",
          },
        ],
        14: [
          "14px",
          {
            lineHeight: "normal",
          },
        ],
        15: [
          "15px",
          {
            lineHeight: "18px",
            letterSpacing: "1px",
          },
        ],
        16: [
          "16px",
          {
            lineHeight: "normal",
          },
        ],
        18: [
          "18px",
          {
            lineHeight: "18px",
          },
        ],
        20: [
          "20px",
          {
            lineHeight: "35px",
          },
        ],
        24: [
          "24px",
          {
            lineHeight: "28.8px",
            letterSpacing: "1.44px",
          },
        ],
        32: [
          "32px",
          {
            lineHeight: "41.6px",
            letterSpacing: "0.6px",
          },
        ],
        13.3333: [
          "13.3333px",
          {
            lineHeight: "normal",
          },
        ],
      },
      spacing: {
        10: "20px",
        12: "24px",
        15: "30px",
        16: "32px",
        17: "34px",
        18: "36px",
        20: "40px",
        25: "50px",
        40: "80px",
        60: "120px",
        "1px": "1px",
        "45px": "45px",
        "47px": "47px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        full: "100px",
      },
      boxShadow: {
        xs: "rgba(0, 0, 0, 0.2) 1px 1px 1px 1px",
        sm: "rgba(0, 0, 0, 0.2) 0px 2px 6px 0px",
        md: "rgba(0, 0, 0, 0.2) 0px 2px 8px 0px",
        lg: "rgba(0, 0, 0, 0.2) 0px 0px 25px 0px",
        xl: "rgba(0, 0, 0, 0.2) 0px 26px 80px 0px",
      },
      screens: {
        md: "768px",
        lg: "1044px",
        xl: "1281px",
      },
      transitionDuration: {
        100: "0.1s",
        200: "0.2s",
        300: "0.3s",
        400: "0.4s",
        500: "0.5s",
      },
      transitionTimingFunction: {
        custom: "cubic-bezier(0.4, 0, 0.2, 1)",
        default: "ease",
      },
      container: {
        center: true,
        padding: "0px",
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
};
