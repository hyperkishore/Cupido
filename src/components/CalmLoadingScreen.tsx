import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

interface CalmLoadingScreenProps {
  message?: string;
}

export const CalmLoadingScreen: React.FC<CalmLoadingScreenProps> = ({
  message = 'Loading your reflection space'
}) => {
  console.log('[CalmLoadingScreen] Rendering with message:', message);

  const breatheAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Use native driver only on native platforms, not on web
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    console.log('[CalmLoadingScreen] Starting animations... (native driver:', useNativeDriver, ')');
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver,
    }).start();

    // Breathing circle animation (like Calm app)
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver,
        }),
      ])
    );

    // Subtle pulse animation for text
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver,
        }),
      ])
    );

    breathingAnimation.start();
    pulseAnimation.start();

    return () => {
      breathingAnimation.stop();
      pulseAnimation.stop();
    };
  }, [breatheAnim, fadeAnim, pulseAnim, useNativeDriver]);

  const circleScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const circleOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const innerCircleScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Breathing circles */}
        <View style={styles.circleContainer}>
          {/* Outer breathing circle */}
          <Animated.View
            style={[
              styles.outerCircle,
              {
                transform: [{ scale: circleScale }],
                opacity: circleOpacity,
              },
            ]}
          />

          {/* Inner breathing circle */}
          <Animated.View
            style={[
              styles.innerCircle,
              {
                transform: [{ scale: innerCircleScale }],
              },
            ]}
          />

          {/* Center dot */}
          <View style={styles.centerDot} />
        </View>

        {/* App title */}
        <Text style={styles.title}>Cupido</Text>

        {/* Loading message with subtle pulse */}
        <Animated.Text
          style={[
            styles.message,
            { opacity: pulseAnim }
          ]}
        >
          {message}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  outerCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E8F0FE',
  },
  innerCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#C2D9F5',
  },
  centerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
  },
  title: {
    fontSize: 42,
    fontWeight: '300',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B6B6B',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
