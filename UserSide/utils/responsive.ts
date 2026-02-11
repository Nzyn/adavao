import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isSmallPhone = SCREEN_WIDTH < 375;
export const isTablet = SCREEN_WIDTH >= 768;
export const isLargeTablet = SCREEN_WIDTH >= 1024;

// Responsive spacing system
export const spacing = {
    xs: isTablet ? 6 : 4,
    sm: isTablet ? 10 : 8,
    md: isTablet ? 16 : 12,
    lg: isTablet ? 24 : 16,
    xl: isTablet ? 32 : 20,
    xxl: isTablet ? 48 : 24,
};

// Responsive font sizes
export const fontSize = {
    xs: isTablet ? 14 : 12,
    sm: isTablet ? 16 : 14,
    md: isTablet ? 18 : 16,
    lg: isTablet ? 22 : 18,
    xl: isTablet ? 28 : 22,
    xxl: isTablet ? 36 : 28,
    title: isTablet ? 42 : 32,
};

// Responsive container padding
export const containerPadding = {
    horizontal: isTablet ? SCREEN_WIDTH * 0.08 : SCREEN_WIDTH * 0.05, // 8% on tablet, 5% on phone
    vertical: isTablet ? 24 : 16,
};

// Responsive card dimensions
export const cardWidth = isTablet ? SCREEN_WIDTH * 0.45 : SCREEN_WIDTH * 0.9;
export const cardPadding = isTablet ? 20 : 16;

// Responsive button dimensions
export const buttonHeight = isTablet ? 56 : 48;
export const buttonPadding = {
    horizontal: isTablet ? 32 : 24,
    vertical: isTablet ? 16 : 12,
};

// Responsive modal dimensions
export const modalWidth = isTablet ? Math.min(SCREEN_WIDTH * 0.6, 600) : SCREEN_WIDTH * 0.9;

// Responsive icon sizes
export const iconSize = {
    sm: isTablet ? 20 : 16,
    md: isTablet ? 28 : 24,
    lg: isTablet ? 36 : 32,
    xl: isTablet ? 48 : 40,
};

// Safe area insets (for notched devices)
export const safeAreaTop = Platform.OS === 'ios' ? 44 : 0;
export const safeAreaBottom = Platform.OS === 'ios' ? 34 : 0;

// Responsive border radius
export const borderRadius = {
    sm: isTablet ? 8 : 6,
    md: isTablet ? 12 : 8,
    lg: isTablet ? 16 : 12,
    xl: isTablet ? 24 : 16,
};

// Helper function to scale size based on screen width
export const scaleSize = (size: number): number => {
    const baseWidth = 375; // iPhone X width as base
    return (SCREEN_WIDTH / baseWidth) * size;
};

// Helper function to scale font
export const scaleFont = (size: number): number => {
    return Math.round(scaleSize(size));
};

// Responsive grid columns
export const gridColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;

// Export dimensions for use in components
export { SCREEN_WIDTH, SCREEN_HEIGHT };
