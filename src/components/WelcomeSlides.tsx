import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppMode } from '../contexts/AppModeContext';

interface WelcomeSlidesProps {
  onComplete: () => void;
}

const CONTENT_WIDTH_MAX = 420;

const SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to\nCupido',
    subtitle: 'Dating that starts with\nknowing yourself',
    type: 'breathing' as const,
  },
  {
    key: 'how',
    title: 'Reflect, Discover,\nConnect',
    subtitle: 'Answer thoughtful questions.\nBuild your authentic profile.\nMatch with people who truly get you.',
    type: 'steps' as const,
  },
  {
    key: 'privacy',
    title: 'Your Privacy,\nAlways',
    subtitle: 'Your reflections build your profile\u2014\nbut you control what\u2019s shared.',
    type: 'shield' as const,
  },
  {
    key: 'start',
    title: 'Ready to\nBegin?',
    subtitle: 'Your journey starts with\na single reflection.',
    type: 'cta' as const,
  },
];

export const WelcomeSlides: React.FC<WelcomeSlidesProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setMode } = useAppMode();
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const anim = Animated.loop(
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
    anim.start();
    return () => anim.stop();
  }, [breatheAnim, useNativeDriver]);

  const goToSlide = (index: number) => {
    // Fade out, switch, fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver,
    }).start(() => {
      setCurrentIndex(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver,
      }).start();
    });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDemoMode = () => {
    setMode('demo');
  };

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

  const slide = SLIDES[currentIndex];

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'breathing':
        return (
          <View style={styles.iconArea}>
            <View style={styles.breatheContainer}>
              <Animated.View
                style={[
                  styles.outerCircle,
                  { transform: [{ scale: circleScale }], opacity: circleOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.innerCircle,
                  { transform: [{ scale: innerCircleScale }] },
                ]}
              />
              <View style={styles.centerDot} />
            </View>
          </View>
        );
      case 'steps':
        return (
          <View style={styles.iconArea}>
            <View style={styles.stepsRow}>
              <View style={styles.stepItem}>
                <View style={styles.stepCircle}>
                  <Feather name="edit-3" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.stepLabel}>Reflect</Text>
              </View>
              <View style={styles.stepArrow}>
                <Feather name="arrow-right" size={18} color="#C6C6C8" />
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepCircle}>
                  <Feather name="user" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.stepLabel}>Discover</Text>
              </View>
              <View style={styles.stepArrow}>
                <Feather name="arrow-right" size={18} color="#C6C6C8" />
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepCircle}>
                  <Feather name="heart" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.stepLabel}>Connect</Text>
              </View>
            </View>
          </View>
        );
      case 'shield':
        return (
          <View style={styles.iconArea}>
            <View style={styles.shieldContainer}>
              <Feather name="shield" size={64} color="#4A90E2" />
            </View>
          </View>
        );
      case 'cta':
        return (
          <View style={styles.iconArea}>
            <View style={styles.ctaIconContainer}>
              <Feather name="sunrise" size={64} color="#4A90E2" />
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Current slide */}
      <Animated.View style={[styles.slideArea, { opacity: fadeAnim }]}>
        <View style={styles.slideContent}>
          {renderSlideContent()}
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        </View>
      </Animated.View>

      {/* Bottom area: dots + button */}
      <View style={styles.bottomArea}>
        {/* Page dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Demo mode link on last slide */}
        {currentIndex === SLIDES.length - 1 && (
          <TouchableOpacity style={styles.demoLink} onPress={handleDemoMode}>
            <Text style={styles.demoLinkText}>Just exploring? Try demo mode</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 56 : 16,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  slideArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: CONTENT_WIDTH_MAX,
  },
  iconArea: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  breatheContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F0FE',
  },
  innerCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#C2D9F5',
  },
  centerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  stepArrow: {
    marginHorizontal: 12,
    marginBottom: 24,
  },
  shieldContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 42,
    fontWeight: '300',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 48,
  },
  slideSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomArea: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'web' ? 32 : Platform.OS === 'ios' ? 50 : 32,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#000000',
  },
  dotInactive: {
    backgroundColor: '#C6C6C8',
  },
  nextButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignSelf: 'stretch',
    maxWidth: CONTENT_WIDTH_MAX - 64,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  demoLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  demoLinkText: {
    fontSize: 15,
    color: '#8E8E93',
    textDecorationLine: 'underline',
  },
});

export default WelcomeSlides;
