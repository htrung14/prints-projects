// React Theme — extracted from https://www.lemaire.fr/
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
    neutral300: string;
    neutral400: string;
    neutral500: string;
 *   };
 *   fonts: {
    body: string;
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
    '13.3333': string;
 *   };
 *   space: {
    '1': string;
    '20': string;
    '24': string;
    '30': string;
    '32': string;
    '34': string;
    '36': string;
    '40': string;
    '45': string;
    '47': string;
    '50': string;
    '80': string;
    '120': string;
 *   };
 *   radii: {
    sm: string;
    md: string;
    full: string;
 *   };
 *   shadows: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
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
    primary: "#100a0d",
    secondary: "#fdfbf9",
    accent: "#fdfbf9",
    background: "#fdfbf9",
    foreground: "#000000",
    neutral50: "#000000",
    neutral100: "#77716e",
    neutral200: "#383d41",
    neutral300: "#333333",
    neutral400: "#e5e5e5",
    neutral500: "#242121",
  },
  fonts: {
    body: "'GTStandard-M', sans-serif",
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
    13.3333: "13.3333px",
  },
  space: {
    1: "1px",
    20: "20px",
    24: "24px",
    30: "30px",
    32: "32px",
    34: "34px",
    36: "36px",
    40: "40px",
    45: "45px",
    47: "47px",
    50: "50px",
    80: "80px",
    120: "120px",
  },
  radii: {
    sm: "4px",
    md: "8px",
    full: "100px",
  },
  shadows: {
    xs: "rgba(0, 0, 0, 0.2) 1px 1px 1px 1px",
    sm: "rgba(0, 0, 0, 0.2) 0px 2px 6px 0px",
    md: "rgba(0, 0, 0, 0.2) 0px 2px 8px 0px",
    lg: "rgba(0, 0, 0, 0.2) 0px 0px 25px 0px",
    xl: "rgba(0, 0, 0, 0.2) 0px 26px 80px 0px",
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
      main: "#100a0d",
      light: "hsl(330, 23%, 20%)",
      dark: "hsl(330, 23%, 10%)",
    },
    secondary: {
      main: "#fdfbf9",
      light: "hsl(30, 50%, 95%)",
      dark: "hsl(30, 50%, 83%)",
    },
    background: {
      default: "#fdfbf9",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#100a0d",
    },
  },
  typography: {
    fontFamily: "'EBGaramond', sans-serif",
    h1: {
      fontSize: "32px",
      fontWeight: "400",
      lineHeight: "41.6px",
    },
    h2: {
      fontSize: "24px",
      fontWeight: "400",
      lineHeight: "28.8px",
    },
    h3: {
      fontSize: "20px",
      fontWeight: "400",
      lineHeight: "35px",
    },
    body1: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "normal",
    },
    body2: {
      fontSize: "15px",
      fontWeight: "400",
      lineHeight: "18px",
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "rgba(0, 0, 0, 0.13) 1px 0px 0px 0px inset, rgba(0, 0, 0, 0.13) -1px 0px 0px 0px inset, rgba(0, 0, 0, 0.17) 0px -1px 0px 0px inset, rgba(204, 204, 204, 0.5) 0px 1px 0px 0px inset, rgba(26, 26, 26, 0.24) 0px 12px 20px -8px",
    "rgba(0, 0, 0, 0.2) 1px 1px 1px 1px",
    "rgba(0, 0, 0, 0.2) 0px 2px 6px 0px",
    "rgba(0, 0, 0, 0.2) 0px 2px 8px 0px",
    "rgba(0, 0, 0, 0.2) 0px 0px 25px 0px",
  ],
};

export default theme;
