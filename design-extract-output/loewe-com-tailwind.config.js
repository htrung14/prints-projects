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
          DEFAULT: "#f2ca56",
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
          DEFAULT: "#e91802",
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
          DEFAULT: "#f2ca56",
        },
        "neutral-50": "#000000",
        "neutral-100": "#ffffff",
        "neutral-200": "#333333",
        background: "#ffffff",
        foreground: "#000000",
      },
      fontFamily: {
        sans: ["Avus", "sans-serif"],
        body: ["AvusPro", "sans-serif"],
        heading: ["Loewe", "sans-serif"],
      },
      fontSize: {
        12: [
          "12px",
          {
            lineHeight: "16.8px",
          },
        ],
        13: [
          "13px",
          {
            lineHeight: "normal",
          },
        ],
        14: [
          "14px",
          {
            lineHeight: "normal",
          },
        ],
        16: [
          "16px",
          {
            lineHeight: "20px",
          },
        ],
        17: [
          "17px",
          {
            lineHeight: "normal",
          },
        ],
        18: [
          "18px",
          {
            lineHeight: "22.5px",
          },
        ],
        21: [
          "21px",
          {
            lineHeight: "24px",
          },
        ],
        22: [
          "22px",
          {
            lineHeight: "20px",
          },
        ],
        24: [
          "24px",
          {
            lineHeight: "24px",
          },
        ],
        26: [
          "26px",
          {
            lineHeight: "24px",
          },
        ],
        28: [
          "28px",
          {
            lineHeight: "normal",
          },
        ],
        42: [
          "42px",
          {
            lineHeight: "48.3px",
            letterSpacing: "-0.63px",
          },
        ],
        19.5: [
          "19.5px",
          {
            lineHeight: "normal",
          },
        ],
        14.3: [
          "14.3px",
          {
            lineHeight: "14.3px",
            letterSpacing: "1px",
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
        6: "12px",
        10: "20px",
        12: "24px",
        16: "32px",
        26: "52px",
        40: "80px",
        "1px": "1px",
        "47px": "47px",
      },
      borderRadius: {
        xs: "1px",
        sm: "4px",
        lg: "12px",
        full: "100px",
      },
      boxShadow: {
        sm: "rgb(34, 34, 34) 0px 0px 7px 0px",
        lg: "rgba(0, 0, 0, 0.35) 0px 0px 30px 0px",
      },
      screens: {
        "0px": "0px",
        sm: "600px",
        "1440px": "1440px",
        "2xl": "1600px",
        "1920px": "1920px",
        "2560px": "2560px",
      },
      transitionDuration: {
        0: "0s",
        50: "0.05s",
        100: "0.1s",
        200: "0.2s",
        250: "0.25s",
        300: "0.3s",
        400: "0.4s",
        500: "0.5s",
        600: "0.6s",
        700: "0.7s",
        10000: "10s",
      },
      transitionTimingFunction: {
        custom: "cubic-bezier(0, 0, 0.58, 1)",
        default: "ease",
      },
      container: {
        center: true,
        padding: "0px",
      },
      maxWidth: {
        container: "100%",
      },
    },
  },
};
