import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Device breakpoints
export const BREAKPOINTS = {
  SMALL_PHONE: 375,
  MEDIUM_PHONE: 414,
  LARGE_PHONE: 700,
  TABLET: 768,
  LARGE_TABLET: 1024,
};

// Device detection
export const isSmallPhone = width < BREAKPOINTS.SMALL_PHONE;
export const isMediumPhone =
  width >= BREAKPOINTS.SMALL_PHONE && width < BREAKPOINTS.MEDIUM_PHONE;
export const isLargePhone =
  width >= BREAKPOINTS.MEDIUM_PHONE && width < BREAKPOINTS.LARGE_PHONE;
export const isTablet = width >= BREAKPOINTS.LARGE_PHONE;
export const isLargeTablet = width >= BREAKPOINTS.LARGE_TABLET;

// Platform detection
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

// Screen dimensions
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Responsive sizing function
export const getResponsiveSize = (
  small,
  medium,
  large,
  tablet,
  largeTablet = tablet,
) => {
  if (isLargeTablet) return largeTablet;
  if (isTablet) return tablet;
  if (isLargePhone) return large;
  if (isMediumPhone) return medium;
  return small;
};

// Responsive font sizes
export const FONT_SIZES = {
  xs: getResponsiveSize(10, 11, 12, 14),
  sm: getResponsiveSize(12, 14, 16, 18),
  base: getResponsiveSize(14, 16, 18, 20),
  lg: getResponsiveSize(16, 18, 20, 22),
  xl: getResponsiveSize(18, 20, 22, 24),
  "2xl": getResponsiveSize(20, 22, 24, 26),
  "3xl": getResponsiveSize(22, 24, 26, 28),
  "4xl": getResponsiveSize(24, 26, 28, 30),
  "5xl": getResponsiveSize(26, 28, 30, 32),
};

// Responsive spacing
export const SPACING = {
  xs: getResponsiveSize(4, 6, 8, 10),
  sm: getResponsiveSize(8, 10, 12, 16),
  md: getResponsiveSize(12, 16, 20, 24),
  lg: getResponsiveSize(16, 20, 24, 32),
  xl: getResponsiveSize(20, 24, 32, 40),
  "2xl": getResponsiveSize(24, 32, 40, 48),
  "3xl": getResponsiveSize(32, 40, 48, 56),
};

// Responsive padding/margins
export const PADDING = {
  xs: getResponsiveSize(8, 10, 12, 16),
  sm: getResponsiveSize(12, 16, 20, 24),
  md: getResponsiveSize(16, 20, 24, 32),
  lg: getResponsiveSize(20, 24, 32, 40),
  xl: getResponsiveSize(24, 32, 40, 48),
};

// Responsive border radius
export const BORDER_RADIUS = {
  sm: getResponsiveSize(4, 6, 8, 10),
  md: getResponsiveSize(8, 10, 12, 16),
  lg: getResponsiveSize(12, 16, 18, 24),
  xl: getResponsiveSize(16, 20, 24, 32),
  "2xl": getResponsiveSize(20, 24, 28, 36),
};

// Responsive icon sizes
export const ICON_SIZES = {
  xs: getResponsiveSize(12, 14, 16, 18),
  sm: getResponsiveSize(16, 18, 20, 22),
  md: getResponsiveSize(20, 22, 24, 26),
  lg: getResponsiveSize(24, 26, 28, 30),
  xl: getResponsiveSize(28, 30, 32, 36),
  "2xl": getResponsiveSize(32, 36, 40, 44),
};

// Responsive card dimensions
export const CARD_DIMENSIONS = {
  height: {
    small: getResponsiveSize(120, 140, 160, 180),
    medium: getResponsiveSize(160, 180, 200, 220),
    large: getResponsiveSize(200, 220, 240, 260),
  },
  width: {
    small: getResponsiveSize(140, 160, 180, 200),
    medium: getResponsiveSize(180, 200, 220, 240),
    large: getResponsiveSize(220, 240, 260, 280),
  },
};

// Grid columns based on screen size
export const GRID_COLUMNS = {
  mobile: 1,
  tablet: 2,
  largeTablet: 3,
};

// Get current grid columns
export const getGridColumns = () => {
  if (isLargeTablet) return GRID_COLUMNS.largeTablet;
  if (isTablet) return GRID_COLUMNS.tablet;
  return GRID_COLUMNS.mobile;
};

// Responsive container width
export const getContainerWidth = () => {
  if (isLargeTablet) return "90%";
  if (isTablet) return "95%";
  return "100%";
};

// Responsive modal width
export const getModalWidth = () => {
  if (isLargeTablet) return 500;
  if (isTablet) return 450;
  return Math.min(width * 0.94, 400);
};

// Responsive tab bar height
export const getTabBarHeight = () => {
  if (isTablet) return isIOS ? 90 : 78;
  return isIOS ? 80 : 68;
};

// Responsive header height
export const getHeaderHeight = () => {
  if (isTablet) return isIOS ? 60 : 56;
  return isIOS ? 48 : 24;
};

// Responsive shadow
export const getShadow = (level = "md") => {
  const shadows = {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  };
  return shadows[level] || shadows.md;
};
