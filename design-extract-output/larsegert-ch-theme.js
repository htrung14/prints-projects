// React Theme — extracted from https://www.larsegert.ch/
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
    neutral300: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '28': string;
    '128': string;
    '23.04': string;
    '14.976': string;
    '11.52': string;
    '9.216': string;
 *   };
 *   space: {
    '1': string;
    '64': string;
    '115': string;
 *   };
 *   radii: {
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
    primary: "#ff0000",
    background: "#ffffff",
    foreground: "#000000",
    neutral50: "#323232",
    neutral100: "#000000",
    neutral200: "#ffffff",
    neutral300: "#1a1a1a",
  },
  fonts: {
    body: "'-apple-system', sans-serif",
  },
  fontSizes: {
    28: "28px",
    128: "128px",
    23.04: "23.04px",
    14.976: "14.976px",
    11.52: "11.52px",
    9.216: "9.216px",
  },
  space: {
    1: "1px",
    64: "64px",
    115: "115px",
  },
  radii: {
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
    primary: {
      main: "#ff0000",
      light: "hsl(0, 100%, 65%)",
      dark: "hsl(0, 100%, 35%)",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#ff0000",
    },
  },
  typography: {
    fontFamily: "'Times', sans-serif",
    h1: {
      fontSize: "128px",
      fontWeight: "500",
      lineHeight: "166.4px",
    },
    h2: {
      fontSize: "28px",
      fontWeight: "400",
      lineHeight: "28px",
    },
    h3: {
      fontSize: "23.04px",
      fontWeight: "400",
      lineHeight: "23.04px",
    },
    body2: {
      fontSize: "9.216px",
      fontWeight: "500",
      lineHeight: "11.52px",
    },
  },
  shape: {
    borderRadius: 100,
  },
  shadows: [],
};

export default theme;
