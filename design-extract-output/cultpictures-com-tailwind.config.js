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
          DEFAULT: "#faf8ed",
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
          DEFAULT: "#faf8ed",
        },
        "neutral-50": "#000000",
        "neutral-100": "#161616",
        background: "#161616",
        foreground: "#000000",
      },
      fontFamily: {
        body: ["Times", "sans-serif"],
      },
      fontSize: {
        14.5: [
          "14.5px",
          {
            lineHeight: "23.925px",
          },
        ],
        13.824: [
          "13.824px",
          {
            lineHeight: "21.4272px",
          },
        ],
        11.52: [
          "11.52px",
          {
            lineHeight: "normal",
          },
        ],
      },
      spacing: {
        0: "26px",
        1: "330px",
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
