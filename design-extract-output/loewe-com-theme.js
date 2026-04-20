// React Theme — extracted from https://loewe.com
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
 *   };
 *   fonts: {
    body: string;
    heading: string;
 *   };
 *   fontSizes: {
    '14': string;
    '16': string;
    '17': string;
    '18': string;
    '21': string;
    '22': string;
    '24': string;
    '26': string;
    '28': string;
    '42': string;
    '19.5': string;
    '14.3': string;
 *   };
 *   space: {
    '1': string;
    '12': string;
    '20': string;
    '24': string;
    '32': string;
    '47': string;
    '52': string;
    '80': string;
 *   };
 *   radii: {
    xs: string;
    sm: string;
    lg: string;
    full: string;
 *   };
 *   shadows: {
    sm: string;
    lg: string;
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
    primary: "#f2ca56",
    secondary: "#e91802",
    accent: "#f2ca56",
    background: "#ffffff",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#ffffff",
    neutral200: "#333333",
  },
  fonts: {
    body: "'AvusPro', sans-serif",
    heading: "'Loewe', sans-serif",
  },
  fontSizes: {
    14: "14px",
    16: "16px",
    17: "17px",
    18: "18px",
    21: "21px",
    22: "22px",
    24: "24px",
    26: "26px",
    28: "28px",
    42: "42px",
    19.5: "19.5px",
    14.3: "14.3px",
  },
  space: {
    1: "1px",
    12: "12px",
    20: "20px",
    24: "24px",
    32: "32px",
    47: "47px",
    52: "52px",
    80: "80px",
  },
  radii: {
    xs: "1px",
    sm: "4px",
    lg: "12px",
    full: "100px",
  },
  shadows: {
    sm: "rgb(34, 34, 34) 0px 0px 7px 0px",
    lg: "rgba(0, 0, 0, 0.35) 0px 0px 30px 0px",
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
    primary: {
      main: "#f2ca56",
      light: "hsl(45, 86%, 79%)",
      dark: "hsl(45, 86%, 49%)",
    },
    secondary: {
      main: "#e91802",
      light: "hsl(6, 98%, 61%)",
      dark: "hsl(6, 98%, 31%)",
    },
    background: {
      default: "#ffffff",
      paper: "#000000",
    },
    text: {
      primary: "#000000",
      secondary: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Times', sans-serif",
    h1: {
      fontSize: "42px",
      fontWeight: "400",
      lineHeight: "48.3px",
      fontFamily: "'Loewe', sans-serif",
    },
    h2: {
      fontSize: "24px",
      fontWeight: "500",
      lineHeight: "24px",
      fontFamily: "'Loewe', sans-serif",
    },
    h3: {
      fontSize: "21px",
      fontWeight: "500",
      lineHeight: "24px",
      fontFamily: "'Loewe', sans-serif",
    },
  },
  shape: {
    borderRadius: 1,
  },
  shadows: ["rgb(34, 34, 34) 0px 0px 7px 0px", "rgba(0, 0, 0, 0.35) 0px 0px 30px 0px"],
};

export default theme;
