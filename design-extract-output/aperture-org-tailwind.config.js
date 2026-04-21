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
          DEFAULT: "#0000ff",
        },
        "neutral-50": "#000000",
        "neutral-100": "#ffffff",
        "neutral-200": "#888888",
        "neutral-300": "#555555",
        "neutral-400": "#bdbdbd",
        "neutral-500": "#333333",
        "neutral-600": "#f2f2f2",
        "neutral-700": "#e5e5e5",
        background: "#f2f2f2",
        foreground: "#000000",
      },
      fontFamily: {
        body: ["icomoon", "sans-serif"],
        heading: ["Aperture Serif", "sans-serif"],
        font2: ["ApertureTextBoldWEB", "sans-serif"],
        font3: ["sans-serif", "sans-serif"],
      },
      fontSize: {
        0: [
          "0px",
          {
            lineHeight: "0px",
          },
        ],
        10: [
          "10px",
          {
            lineHeight: "normal",
          },
        ],
        11: [
          "11px",
          {
            lineHeight: "14.3px",
            letterSpacing: "1px",
          },
        ],
        12: [
          "12px",
          {
            lineHeight: "12px",
            letterSpacing: "0.3px",
          },
        ],
        13: [
          "13px",
          {
            lineHeight: "20px",
          },
        ],
        14: [
          "14px",
          {
            lineHeight: "18.2px",
          },
        ],
        15: [
          "15px",
          {
            lineHeight: "15px",
          },
        ],
        16: [
          "16px",
          {
            lineHeight: "20.8px",
          },
        ],
        18: [
          "18px",
          {
            lineHeight: "18px",
            letterSpacing: "0.3px",
          },
        ],
        20: [
          "20px",
          {
            lineHeight: "24px",
            letterSpacing: "0.3px",
          },
        ],
        24: [
          "24px",
          {
            lineHeight: "24px",
          },
        ],
        32: [
          "32px",
          {
            lineHeight: "40px",
          },
        ],
        40: [
          "40px",
          {
            lineHeight: "40px",
          },
        ],
      },
      spacing: {
        1: "2px",
        10: "20px",
        15: "30px",
        20: "40px",
        25: "50px",
        30: "60px",
        40: "80px",
        50: "100px",
        "65px": "65px",
        "75px": "75px",
        "85px": "85px",
      },
      borderRadius: {
        xs: "2px",
        xl: "20px",
        full: "90px",
      },
      boxShadow: {
        sm: "rgb(128, 128, 128) 0px 0px 5px 0px",
        lg: "rgba(0, 0, 0, 0.1) 0px 1px 20px 0px",
      },
      screens: {
        sm: "601px",
        md: "769px",
        lg: "1024px",
        "1134px": "1134px",
        "1168px": "1168px",
        xl: "1290px",
        "1440px": "1440px",
        "2xl": "1500px",
        "1681px": "1681px",
        "1920px": "1920px",
      },
      transitionDuration: {
        150: "0.15s",
        200: "0.2s",
        300: "0.3s",
        400: "0.4s",
        500: "0.5s",
      },
      transitionTimingFunction: {
        linear: "linear",
        default: "ease",
      },
      container: {
        center: true,
        padding: "0px",
      },
      maxWidth: {
        container: "1110px",
      },
    },
  },
};
