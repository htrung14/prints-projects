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
          DEFAULT: "#0000ee",
        },
        "neutral-50": "#000000",
        "neutral-100": "#808080",
        "neutral-200": "#ffffff",
        background: "#ffffff",
        foreground: "#000000",
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        14.5: [
          "14.5px",
          {
            lineHeight: "23.925px",
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
            lineHeight: "10.5984px",
          },
        ],
        5.76: [
          "5.76px",
          {
            lineHeight: "6.624px",
          },
        ],
      },
      spacing: {
        3: "6px",
        10: "20px",
        95: "190px",
        164: "328px",
        "415px": "415px",
      },
      transitionDuration: {
        200: "0.2s",
        222: "0.222s",
        300: "0.3s",
      },
      transitionTimingFunction: {
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
