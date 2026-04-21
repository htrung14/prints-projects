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
          DEFAULT: "#ff0000",
        },
        "neutral-50": "#323232",
        "neutral-100": "#000000",
        "neutral-200": "#ffffff",
        "neutral-300": "#1a1a1a",
        background: "#ffffff",
        foreground: "#000000",
      },
      fontFamily: {
        sans: ["Helvetica Neue", "sans-serif"],
        body: ["-apple-system", "sans-serif"],
      },
      fontSize: {
        28: [
          "28px",
          {
            lineHeight: "28px",
          },
        ],
        128: [
          "128px",
          {
            lineHeight: "166.4px",
          },
        ],
        23.04: [
          "23.04px",
          {
            lineHeight: "23.04px",
          },
        ],
        14.976: [
          "14.976px",
          {
            lineHeight: "18.432px",
          },
        ],
        11.52: [
          "11.52px",
          {
            lineHeight: "normal",
          },
        ],
        9.216: [
          "9.216px",
          {
            lineHeight: "11.52px",
          },
        ],
      },
      spacing: {
        0: "1px",
        1: "64px",
        2: "115px",
      },
      borderRadius: {
        full: "100px",
      },
      transitionDuration: {
        300: "0.3s",
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
