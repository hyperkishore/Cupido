import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface LayoutDebuggerProps {
  enabled?: boolean;
  showGrid?: boolean;
  showInsets?: boolean;
  showDimensions?: boolean;
  children?: React.ReactNode;
}

/**
 * LayoutDebugger Component
 * 
 * A development tool to visualize layout issues and prevent UI elements from being hidden.
 * 
 * Features:
 * - Shows safe area insets
 * - Displays screen dimensions
 * - Optional grid overlay
 * - Highlights potential overlap areas
 * 
 * Usage:
 * Wrap any screen component with LayoutDebugger during development:
 * 
 * <LayoutDebugger enabled={__DEV__}>
 *   <YourScreenComponent />
 * </LayoutDebugger>
 */
export const LayoutDebugger: React.FC<LayoutDebuggerProps> = ({
  enabled = __DEV__,
  showGrid = false,
  showInsets = true,
  showDimensions = true,
  children,
}) => {
  const insets = useSafeAreaInsets();

  if (!enabled) {
    return <>{children}</>;
  }

  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;
  const headerHeight = 60;

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}
      
      {/* Safe Area Indicators */}
      {showInsets && (
        <>
          {/* Top safe area */}
          <View style={[
            styles.safeAreaIndicator,
            styles.topIndicator,
            { height: insets.top }
          ]}>
            <Text style={styles.indicatorText}>Safe Area Top: {insets.top}px</Text>
          </View>
          
          {/* Bottom safe area */}
          <View style={[
            styles.safeAreaIndicator,
            styles.bottomIndicator,
            { height: insets.bottom + tabBarHeight }
          ]}>
            <Text style={styles.indicatorText}>
              Tab Bar + Safe Area: {insets.bottom + tabBarHeight}px
            </Text>
          </View>
          
          {/* Header area */}
          <View style={[
            styles.safeAreaIndicator,
            styles.headerIndicator,
            { top: insets.top, height: headerHeight }
          ]}>
            <Text style={styles.indicatorText}>Header: {headerHeight}px</Text>
          </View>
        </>
      )}
      
      {/* Grid Overlay */}
      {showGrid && (
        <View style={styles.gridContainer} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: i * 50 }]} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: i * 50 }]} />
          ))}
        </View>
      )}
      
      {/* Dimensions Display */}
      {showDimensions && (
        <View style={styles.dimensionsDisplay}>
          <Text style={styles.dimensionText}>Screen: {width}x{height}</Text>
          <Text style={styles.dimensionText}>Platform: {Platform.OS}</Text>
          <Text style={styles.dimensionText}>
            Usable Height: {height - insets.top - insets.bottom - tabBarHeight - headerHeight}px
          </Text>
        </View>
      )}
      
      {/* Danger Zones */}
      <View style={styles.dangerZoneContainer} pointerEvents="none">
        {/* Bottom danger zone - where content might be hidden */}
        <View style={[
          styles.dangerZone,
          { 
            bottom: 0,
            height: tabBarHeight + insets.bottom,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
          }
        ]}>
          <Text style={styles.dangerText}>⚠️ Content may be hidden here</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIndicator: {
    top: 0,
  },
  bottomIndicator: {
    bottom: 0,
  },
  headerIndicator: {
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
    borderColor: 'rgba(0, 0, 255, 0.5)',
  },
  indicatorText: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  dimensionsDisplay: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
  },
  dimensionText: {
    color: '#FFF',
    fontSize: 10,
    marginBottom: 2,
  },
  dangerZoneContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  dangerZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 12,
    color: 'rgba(255, 0, 0, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

// Layout validation utility
export const validateLayout = (componentName: string, measurements: {
  height?: number;
  width?: number;
  top?: number;
  bottom?: number;
}) => {
  const { height: screenHeight } = Dimensions.get('window');
  const insets = { top: 50, bottom: 34 }; // Approximate values
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;
  
  const warnings: string[] = [];
  
  // Check if content extends into danger zones
  if (measurements.bottom !== undefined && measurements.bottom < tabBarHeight + insets.bottom) {
    warnings.push(`${componentName}: Content may be hidden behind tab bar (bottom: ${measurements.bottom}px)`);
  }
  
  if (measurements.height !== undefined) {
    const availableHeight = screenHeight - insets.top - insets.bottom - tabBarHeight - 60; // 60 for header
    if (measurements.height > availableHeight) {
      warnings.push(`${componentName}: Height (${measurements.height}px) exceeds available space (${availableHeight}px)`);
    }
  }
  
  if (warnings.length > 0 && __DEV__) {
    console.warn('Layout Issues Detected:\n', warnings.join('\n'));
  }
  
  return warnings;
};

// Hook to monitor layout changes
export const useLayoutMonitor = (componentName: string) => {
  React.useEffect(() => {
    if (__DEV__) {
      console.log(`[LayoutMonitor] ${componentName} mounted`);
      
      return () => {
        console.log(`[LayoutMonitor] ${componentName} unmounted`);
      };
    }
  }, [componentName]);
  
  const checkLayout = React.useCallback((measurements: any) => {
    if (__DEV__) {
      validateLayout(componentName, measurements);
    }
  }, [componentName]);
  
  return { checkLayout };
};