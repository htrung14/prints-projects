// React Theme — extracted from https://aperture.org
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
    neutral400: string;
    neutral500: string;
    neutral600: string;
    neutral700: string;
 *   };
 *   fonts: {
    body: string;
    heading: string;
 *   };
 *   fontSizes: {
    '10': string;
    '11': string;
    '12': string;
    '13': string;
    '14': string;
    '15': string;
    '16': string;
    '18': string;
    '20': string;
    '24': string;
    '32': string;
    '40': string;
 *   };
 *   space: {
    '2': string;
    '20': string;
    '30': string;
    '40': string;
    '50': string;
    '60': string;
    '65': string;
    '75': string;
    '80': string;
    '85': string;
    '100': string;
 *   };
 *   radii: {
    xs: string;
    xl: string;
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
    primary: "#0000ff",
    background: "#f2f2f2",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#ffffff",
    neutral200: "#888888",
    neutral300: "#555555",
    neutral400: "#bdbdbd",
    neutral500: "#333333",
    neutral600: "#f2f2f2",
    neutral700: "#e5e5e5",
  },
  fonts: {
    body: "'icomoon', sans-serif",
    heading: "'Aperture Serif', sans-serif",
  },
  fontSizes: {
    10: "10px",
    11: "11px",
    12: "12px",
    13: "13px",
    14: "14px",
    15: "15px",
    16: "16px",
    18: "18px",
    20: "20px",
    24: "24px",
    32: "32px",
    40: "40px",
  },
  space: {
    2: "2px",
    20: "20px",
    30: "30px",
    40: "40px",
    50: "50px",
    60: "60px",
    65: "65px",
    75: "75px",
    80: "80px",
    85: "85px",
    100: "100px",
  },
  radii: {
    xs: "2px",
    xl: "20px",
    full: "90px",
  },
  shadows: {
    sm: "rgb(128, 128, 128) 0px 0px 5px 0px",
    lg: "rgba(0, 0, 0, 0.1) 0px 1px 20px 0px",
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
      main: "#0000ff",
      light: "hsl(240, 100%, 65%)",
      dark: "hsl(240, 100%, 35%)",
    },
    background: {
      default: "#f2f2f2",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: "'ApertureTextRegularWEB', sans-serif",
    h1: {
      fontSize: "32px",
      fontWeight: "700",
      lineHeight: "40px",
      fontFamily: "'Aperture Serif', sans-serif",
    },
    h2: {
      fontSize: "24px",
      fontWeight: "400",
      lineHeight: "24px",
      fontFamily: "'Aperture Serif', sans-serif",
    },
    h3: {
      fontSize: "20px",
      fontWeight: "700",
      lineHeight: "24px",
      fontFamily: "'Aperture Serif', sans-serif",
    },
    body1: {
      fontSize: "16px",
      fontWeight: "300",
      lineHeight: "20.8px",
    },
  },
  shape: {
    borderRadius: 2,
  },
  shadows: ["rgb(128, 128, 128) 0px 0px 5px 0px", "rgba(0, 0, 0, 0.1) 0px 1px 20px 0px"],
};

export default theme;
