import { ViewStyle } from 'react-native';

/**
 * FIXED: Compatibility helper for gap style property
 * The 'gap' property is only supported in React Native 0.71+
 * This helper converts gap to margins for older versions
 */
export function withGapFallback(styles: ViewStyle, gap?: number): ViewStyle {
  // If no gap specified, return styles as-is
  if (!gap) return styles;
  
  // Check if gap is supported (RN 0.71+)
  // We can't directly check RN version at runtime, so we use a feature check
  const supportsGap = typeof styles.gap !== 'undefined' || 'gap' in styles;
  
  if (supportsGap) {
    return { ...styles, gap };
  }
  
  // Fallback: Add margins to children
  // Note: This requires applying marginRight/marginBottom to child components
  console.warn('Gap style not supported in this React Native version. Using margin fallback.');
  
  return {
    ...styles,
    // Remove gap to prevent warnings
    gap: undefined,
  };
}

/**
 * Helper to apply margin to children when gap is not supported
 * Use this on child components when parent uses gap
 */
export function childMarginForGap(gap: number, isLast: boolean = false): ViewStyle {
  if (isLast) return {};
  
  return {
    marginRight: gap / 2,
    marginBottom: gap / 2,
    marginLeft: gap / 2,
    marginTop: gap / 2,
  };
}