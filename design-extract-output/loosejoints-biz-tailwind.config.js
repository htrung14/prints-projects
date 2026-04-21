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
          DEFAULT: "#253525",
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
          DEFAULT: "#fbe122",
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
          DEFAULT: "#253525",
        },
        "neutral-50": "#000000",
        "neutral-100": "#ffffff",
        "neutral-200": "#767676",
        "neutral-300": "#efefef",
        foreground: "#000000",
      },
      fontFamily: {
        body: ["GTStandard-M", "sans-serif"],
      },
      fontSize: {
        12: [
          "12px",
          {
            lineHeight: "16px",
          },
        ],
        16: [
          "16px",
          {
            lineHeight: "normal",
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
        15: "30px",
        24: "48px",
        117: "234px",
        192: "384px",
        233: "466px",
        "1px": "1px",
        "37px": "37px",
      },
      screens: {
        "1px": "1px",
        sm: "576px",
        md: "768px",
        lg: "992px",
        "1200px": "1200px",
      },
      transitionDuration: {
        75: "0.075s",
        150: "0.15s",
        200: "0.2s",
      },
      transitionTimingFunction: {
        default: "ease",
        linear: "linear",
        custom: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
      },
      container: {
        center: true,
        padding: "0px",
      },
      maxWidth: {
        container: "50%",
      },
    },
  },
};
