// React Theme — extracted from https://cultpictures.com
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '14.5': string;
    '13.824': string;
    '11.52': string;
 *   };
 *   space: {
    '26': string;
    '330': string;
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
    primary: "#faf8ed",
    accent: "#faf8ed",
    background: "#161616",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#161616",
  },
  fonts: {
    body: "'Times', sans-serif",
  },
  fontSizes: {
    14.5: "14.5px",
    13.824: "13.824px",
    11.52: "11.52px",
  },
  space: {
    26: "26px",
    330: "330px",
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
      main: "#faf8ed",
      light: "hsl(51, 57%, 95%)",
      dark: "hsl(51, 57%, 80%)",
    },
    background: {
      default: "#161616",
      paper: "#faf8ed",
    },
    text: {
      primary: "#000000",
    },
  },
  typography: {
    fontFamily: "'Diatype Variable', sans-serif",
    body2: {
      fontSize: "11.52px",
      fontWeight: "400",
      lineHeight: "normal",
    },
  },
  shape: {},
  shadows: [],
};

export default theme;
