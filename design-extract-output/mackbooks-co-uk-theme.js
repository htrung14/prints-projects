// React Theme — extracted from https://mackbooks.co.uk
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
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '0': string;
    '10': string;
    '12': string;
    '13': string;
    '15': string;
    '16': string;
    '20': string;
    '25': string;
    '16.875': string;
    '14.0625': string;
    '13.125': string;
    '10.3125': string;
 *   };
 *   space: {
    '1': string;
    '40': string;
    '46': string;
    '52': string;
    '60': string;
    '70': string;
    '75': string;
    '90': string;
    '100': string;
    '120': string;
    '125': string;
    '192': string;
    '211': string;
    '285': string;
    '352': string;
 *   };
 *   radii: {
    sm: string;
    md: string;
    xl: string;
    full: string;
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
    background: "#ffffff",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#ffffff",
    neutral200: "#aaaaaa",
  },
  fonts: {
    body: "'Times', sans-serif",
  },
  fontSizes: {
    0: "0px",
    10: "10px",
    12: "12px",
    13: "13px",
    15: "15px",
    16: "16px",
    20: "20px",
    25: "25px",
    16.875: "16.875px",
    14.0625: "14.0625px",
    13.125: "13.125px",
    10.3125: "10.3125px",
  },
  space: {
    1: "1px",
    40: "40px",
    46: "46px",
    52: "52px",
    60: "60px",
    70: "70px",
    75: "75px",
    90: "90px",
    100: "100px",
    120: "120px",
    125: "125px",
    192: "192px",
    211: "211px",
    285: "285px",
    352: "352px",
  },
  radii: {
    sm: "3px",
    md: "10px",
    xl: "20px",
    full: "100px",
  },
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
    h2: {
      fontSize: "25px",
      fontWeight: "400",
      lineHeight: "25px",
    },
    h3: {
      fontSize: "20px",
      fontWeight: "400",
      lineHeight: "30px",
    },
    body1: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "normal",
    },
    body2: {
      fontSize: "14.0625px",
      fontWeight: "400",
      lineHeight: "17.5781px",
    },
  },
  shape: {
    borderRadius: 6,
  },
  shadows: [],
};

export default theme;
