// React Theme — extracted from https://ssense.com
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
    neutral500: string;
    neutral600: string;
    neutral700: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '0': string;
    '11': string;
    '13': string;
    '16': string;
    '19': string;
    '20': string;
    '40': string;
    '71.25': string;
    '28.5': string;
    '12.35': string;
 *   };
 *   space: {
    '2': string;
    '30': string;
    '40': string;
    '50': string;
    '55': string;
    '60': string;
    '68': string;
    '98': string;
    '109': string;
    '133': string;
    '234': string;
    '290': string;
    '397': string;
    '498': string;
 *   };
 *   radii: {
    sm: string;
    md: string;
 *   };
 *   shadows: {
    sm: string;
 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  colors: {
    background: "#ffffff",
    foreground: "#000000",
    neutral50: "#333333",
    neutral100: "#000000",
    neutral200: "#f4f4f4",
    neutral300: "#888888",
    neutral400: "#979797",
    neutral500: "#ffffff",
    neutral600: "#777777",
    neutral700: "#cccccc",
  },
  fonts: {
    body: "'Favorit SSENSE Inter1', sans-serif",
  },
  fontSizes: {
    0: "0px",
    11: "11px",
    13: "13px",
    16: "16px",
    19: "19px",
    20: "20px",
    40: "40px",
    71.25: "71.25px",
    28.5: "28.5px",
    12.35: "12.35px",
  },
  space: {
    2: "2px",
    30: "30px",
    40: "40px",
    50: "50px",
    55: "55px",
    60: "60px",
    68: "68px",
    98: "98px",
    109: "109px",
    133: "133px",
    234: "234px",
    290: "290px",
    397: "397px",
    498: "498px",
  },
  radii: {
    sm: "3px",
    md: "10px",
  },
  shadows: {
    sm: "rgb(0, 0, 0) 0px 0px 0px 1px inset",
  },
  states: {
    hover: {
      opacity: 0.08,
    },
    focus: {
      opacity: 0.12,
    },
    active: {
      opacity: 0.16,
    },
    disabled: {
      opacity: 0.38,
    },
  },
};

// MUI v5 theme
export const muiTheme = {
  palette: {
    background: {
      default: "#ffffff",
      paper: "#f4f4f4",
    },
    text: {
      primary: "#000000",
      secondary: "#333333",
    },
  },
  typography: {
    fontFamily: "'sans-serif', sans-serif",
    h1: {
      fontSize: "40px",
      fontWeight: "400",
      lineHeight: "44px",
    },
    h2: {
      fontSize: "28.5px",
      fontWeight: "400",
      lineHeight: "34px",
    },
    h3: {
      fontSize: "20px",
      fontWeight: "100",
      lineHeight: "26px",
    },
    body1: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "18.4px",
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: ["rgb(0, 0, 0) 0px 0px 0px 1px inset"],
};

export default theme;
