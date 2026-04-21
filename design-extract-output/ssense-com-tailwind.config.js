/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        "neutral-50": "#333333",
        "neutral-100": "#000000",
        "neutral-200": "#f4f4f4",
        "neutral-300": "#888888",
        "neutral-400": "#979797",
        "neutral-500": "#ffffff",
        "neutral-600": "#777777",
        "neutral-700": "#cccccc",
        background: "#ffffff",
        foreground: "#000000",
      },
      fontFamily: {
        sans: ["JHA Times Now", "sans-serif"],
        heading: ["Favorit SSENSE Inter", "sans-serif"],
        body: ["sans-serif", "sans-serif"],
        font3: ["Favorit SSENSE Inter1", "sans-serif"],
      },
      fontSize: {
        0: [
          "0px",
          {
            lineHeight: "26px",
            letterSpacing: "-0.05px",
          },
        ],
        11: [
          "11px",
          {
            lineHeight: "15px",
          },
        ],
        13: [
          "13px",
          {
            lineHeight: "16px",
          },
        ],
        16: [
          "16px",
          {
            lineHeight: "18.4px",
          },
        ],
        19: [
          "19px",
          {
            lineHeight: "26px",
            letterSpacing: "-0.25px",
          },
        ],
        20: [
          "20px",
          {
            lineHeight: "26px",
            letterSpacing: "-0.05px",
          },
        ],
        40: [
          "40px",
          {
            lineHeight: "44px",
            letterSpacing: "-1px",
          },
        ],
        71.25: [
          "71.25px",
          {
            lineHeight: "76px",
            letterSpacing: "-2.52px",
          },
        ],
        28.5: [
          "28.5px",
          {
            lineHeight: "34px",
            letterSpacing: "-0.5px",
          },
        ],
        12.35: [
          "12.35px",
          {
            lineHeight: "0px",
            letterSpacing: "-0.05px",
          },
        ],
      },
      spacing: {
        1: "2px",
        15: "30px",
        20: "40px",
        25: "50px",
        30: "60px",
        34: "68px",
        49: "98px",
        117: "234px",
        145: "290px",
        249: "498px",
        "55px": "55px",
        "109px": "109px",
        "133px": "133px",
        "397px": "397px",
      },
      borderRadius: {
        sm: "3px",
        md: "10px",
      },
      boxShadow: {
        sm: "rgb(0, 0, 0) 0px 0px 0px 1px inset",
      },
      screens: {
        xs: "375px",
        md: "769px",
        lg: "1025px",
        "1200px": "1200px",
        "1430px": "1430px",
        "1440px": "1440px",
        "1920px": "1920px",
        "2310px": "2310px",
        "2560px": "2560px",
      },
      transitionDuration: {
        350: "0.35s",
        500: "0.5s",
      },
      container: {
        center: true,
        padding: "25px",
      },
      maxWidth: {
        container: "50%",
      },
    },
  },
};
