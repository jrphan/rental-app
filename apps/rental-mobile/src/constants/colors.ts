// App Color Constants
export const COLORS = {
  // Primary Colors - Orange theme like Shopee
  primary: '#f97316',
  primaryLight: '#fb923c',
  primaryDark: '#ea580c',
  
  // Secondary Colors
  secondary: '#6b7280',
  secondaryLight: '#9ca3af',
  secondaryDark: '#374151',
  
  // Background Colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f9fafb',
  
  // Text Colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  textWhite: '#ffffff',
  
  // Status Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border Colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Special Colors for Mid-Autumn Festival
  moon: '#fbbf24',
  lanternRed: '#ef4444',
  lanternGreen: '#22c55e',
  lanternYellow: '#fbbf24',
  
  // Header Colors
  headerBlue: '#1e40af',
  
  // Promo Colors
  promoBackground: '#fef3c7',
  promoText: '#92400e',
} as const;

export type ColorKey = keyof typeof COLORS;
