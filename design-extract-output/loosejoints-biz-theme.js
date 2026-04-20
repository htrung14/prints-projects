// React Theme — extracted from https://loosejoints.biz/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
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
    '12': string;
    '16': string;
    '13.3333': string;
 *   };
 *   space: {
    '1': string;
    '30': string;
    '37': string;
    '48': string;
    '234': string;
    '384': string;
    '466': string;
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
    primary: "#253525",
    secondary: "#fbe122",
    accent: "#253525",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#ffffff",
    neutral200: "#767676",
    neutral300: "#efefef",
  },
  fonts: {
    body: "'GTStandard-M', sans-serif",
  },
  fontSizes: {
    12: "12px",
    16: "16px",
    13.3333: "13.3333px",
  },
  space: {
    1: "1px",
    30: "30px",
    37: "37px",
    48: "48px",
    234: "234px",
    384: "384px",
    466: "466px",
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
      main: "#253525",
      light: "hsl(120, 18%, 33%)",
      dark: "hsl(120, 18%, 10%)",
    },
    secondary: {
      main: "#fbe122",
      light: "hsl(53, 96%, 71%)",
      dark: "hsl(53, 96%, 41%)",
    },
    background: {},
    text: {
      primary: "#000000",
      secondary: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'DiatypePre-Regular', sans-serif",
    body1: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "normal",
    },
    body2: {
      fontSize: "12px",
      fontWeight: "400",
      lineHeight: "16px",
    },
  },
  shape: {},
  shadows: [],
};

export default theme;
