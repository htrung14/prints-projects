/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        "neutral-50": "#000000",
        "neutral-100": "#ffffff",
        "neutral-200": "#aaaaaa",
        background: "#ffffff",
        foreground: "#000000",
      },
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
        body: ["Times", "sans-serif"],
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
            lineHeight: "15px",
          },
        ],
        12: [
          "12px",
          {
            lineHeight: "14.4px",
          },
        ],
        13: [
          "13px",
          {
            lineHeight: "19.5px",
          },
        ],
        15: [
          "15px",
          {
            lineHeight: "22.5px",
          },
        ],
        16: [
          "16px",
          {
            lineHeight: "normal",
          },
        ],
        20: [
          "20px",
          {
            lineHeight: "30px",
          },
        ],
        25: [
          "25px",
          {
            lineHeight: "25px",
          },
        ],
        16.875: [
          "16.875px",
          {
            lineHeight: "25.3125px",
          },
        ],
        14.0625: [
          "14.0625px",
          {
            lineHeight: "17.5781px",
          },
        ],
        13.125: [
          "13.125px",
          {
            lineHeight: "19.6875px",
          },
        ],
        10.3125: [
          "10.3125px",
          {
            lineHeight: "15.4688px",
          },
        ],
      },
      spacing: {
        20: "40px",
        23: "46px",
        26: "52px",
        30: "60px",
        35: "70px",
        45: "90px",
        50: "100px",
        60: "120px",
        96: "192px",
        176: "352px",
        "1px": "1px",
        "75px": "75px",
        "125px": "125px",
        "211px": "211px",
        "285px": "285px",
      },
      borderRadius: {
        sm: "3px",
        md: "10px",
        xl: "20px",
        full: "100px",
      },
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1281px",
        "1366px": "1366px",
        "1921px": "1921px",
      },
      transitionDuration: {
        40: "0.04s",
        80: "0.08s",
        100: "0.1s",
        175: "0.175s",
        250: "0.25s",
        300: "0.3s",
        350: "0.35s",
        550: "0.55s",
      },
      transitionTimingFunction: {
        linear: "linear",
        default: "ease",
      },
      container: {
        center: true,
        padding: "40px",
      },
      maxWidth: {
        container: "1920px",
      },
    },
  },
};
