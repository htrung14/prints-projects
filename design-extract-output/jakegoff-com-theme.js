// React Theme — extracted from https://jakegoff.com/more-simple-chair
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '14.5': string;
    '11.52': string;
    '9.216': string;
    '5.76': string;
 *   };
 *   space: {
    '6': string;
    '20': string;
    '190': string;
    '328': string;
    '415': string;
 *   };
 *   radii: {

 *   };
 *   shadows: {

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
    primary: "#0000ee",
    background: "#ffffff",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#808080",
    neutral200: "#ffffff",
  },
  fonts: {
    body: "'Inter', sans-serif",
  },
  fontSizes: {
    14.5: "14.5px",
    11.52: "11.52px",
    9.216: "9.216px",
    5.76: "5.76px",
  },
  space: {
    6: "6px",
    20: "20px",
    190: "190px",
    328: "328px",
    415: "415px",
  },
  radii: {},
  shadows: {},
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
      main: "#0000ee",
      light: "hsl(240, 100%, 62%)",
      dark: "hsl(240, 100%, 32%)",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#808080",
    },
  },
  typography: {
    fontFamily: "'Diatype Variable', sans-serif",
    body2: {
      fontSize: "5.76px",
      fontWeight: "400",
      lineHeight: "6.624px",
    },
  },
  shape: {},
  shadows: [],
};

export default theme;
