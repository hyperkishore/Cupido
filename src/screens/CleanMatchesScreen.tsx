import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useAppState } from '../contexts/AppStateContext';
import { theme } from '../design-system/tokens';

interface Match {
  id: string;
  profileMatch: number;
  socialAlignment: number;
  overallCompatibility: number;
  sharedInterests: string;
  isLocked: boolean;
  pointsNeeded?: number;
  personalityTraits: string[];
  connectionStrength: 'high' | 'medium' | 'low';
}

export const CleanMatchesScreen = () => {
  const { state, dispatch } = useAppState();
  const [matches] = useState<Match[]>([
    {
      id: '1',
      profileMatch: 87,
      socialAlignment: 0,
      overallCompatibility: 44,
      sharedInterests: "Shares professional ambition and creative interests. Strong alignment in career goals and lifestyle preferences.",
      isLocked: true,
      pointsNeeded: 50,
      personalityTraits: ['Authentic', 'Creative', 'Ambitious'],
      connectionStrength: 'medium',
    },
    {
      id: '2',
      profileMatch: 92,
      socialAlignment: 76,
      overallCompatibility: 84,
      sharedInterests: "Deep connection through shared values about authenticity and vulnerability. Similar communication styles.",
      isLocked: true,
      pointsNeeded: 50,
      personalityTraits: ['Empathetic', 'Vulnerable', 'Thoughtful'],
      connectionStrength: 'high',
    },
    {
      id: '3',
      profileMatch: 78,
      socialAlignment: 82,
      overallCompatibility: 80,
      sharedInterests: "Both value personal growth and continuous learning. Aligned on relationship goals and life philosophy.",
      isLocked: true,
      pointsNeeded: 50,
      personalityTraits: ['Growth-minded', 'Curious', 'Philosophical'],
      connectionStrength: 'high',
    },
  ]);

  const [progressAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    const progressPercentage = (state.userStats.totalPoints / 50) * 100;
    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    if (state.userStats.totalPoints < 50) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [state.userStats.totalPoints]);

  const handleUnlockProgress = () => {
    const pointsNeeded = 50 - state.userStats.totalPoints;
    if (pointsNeeded <= 0) {
      Alert.alert(
        'Unlocked! 🎉',
        'You now have access to 1-1 anonymous chats with your matches!',
        [{ text: 'Start Chatting', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Continue Growing 🌱',
        `You need ${pointsNeeded} more points to unlock matches. Keep reflecting and being authentic to earn points!`,
        [
          { text: 'Continue', style: 'default' },
          { text: 'View Reflection', style: 'cancel' }
        ]
      );
    }
  };

  const getConnectionColor = (strength: string) => {
    switch (strength) {
      case 'high': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.gray400;
      default: return theme.colors.gray400;
    }
  };

  const renderMatchCard = (match: Match) => (
    <View key={match.id} style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.compatibilityBadge}>
          <Text style={styles.compatibilityText}>{match.overallCompatibility}%</Text>
          <Text style={styles.compatibilityLabel}>Match</Text>
        </View>
        <View style={[styles.connectionIndicator, { backgroundColor: getConnectionColor(match.connectionStrength) }]} />
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Profile Match</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${match.profileMatch}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={styles.metricValue}>{match.profileMatch}%</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Social Alignment</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${match.socialAlignment}%`, backgroundColor: theme.colors.cupidoGreen }]} />
            </View>
            <Text style={styles.metricValue}>{match.socialAlignment}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.traitsContainer}>
        <Text style={styles.traitsLabel}>Personality Traits</Text>
        <View style={styles.traitsGrid}>
          {match.personalityTraits.map((trait, index) => (
            <View key={index} style={styles.traitTag}>
              <Text style={styles.traitText}>{trait}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.interestsContainer}>
        <Text style={styles.interestsLabel}>Shared Connection</Text>
        <Text style={styles.interestsText}>{match.sharedInterests}</Text>
      </View>

      {match.isLocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockedText}>
            {match.pointsNeeded} points needed to unlock
          </Text>
        </View>
      )}
    </View>
  );

  const pointsNeeded = 50 - state.userStats.totalPoints;
  const isUnlocked = pointsNeeded <= 0;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Matches</Text>
          <Text style={styles.subtitle}>
            Based on your authentic responses and values
          </Text>
        </View>

        {/* Progress Card */}
        <Animated.View style={[styles.progressCard, { transform: [{ scale: pulseAnimation }] }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>
                {isUnlocked ? 'Matches Unlocked!' : 'Unlock Your Matches'}
              </Text>
              <Text style={styles.progressSubtitle}>
                {isUnlocked 
                  ? 'Start connecting with your compatible matches' 
                  : `${pointsNeeded} more points needed`
                }
              </Text>
            </View>
            <Text style={styles.progressEmoji}>
              {isUnlocked ? '🎉' : '🔓'}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {state.userStats.totalPoints} / 50 points
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.unlockButton, isUnlocked && styles.unlockButtonUnlocked]}
            onPress={handleUnlockProgress}
          >
            <Text style={[styles.unlockButtonText, isUnlocked && styles.unlockButtonTextUnlocked]}>
              {isUnlocked ? 'Start Chatting' : 'Continue Growing'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Matches Grid */}
        <View style={styles.matchesContainer}>
          {matches.map(renderMatchCard)}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.huge,
  },
  header: {
    paddingHorizontal: theme.layout.containerPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.largeTitle,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
  },
  progressCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.layout.containerPadding,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    ...theme.typography.title3,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  progressSubtitle: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
  },
  progressEmoji: {
    fontSize: 32,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  unlockButtonUnlocked: {
    backgroundColor: theme.colors.success,
  },
  unlockButtonText: {
    ...theme.typography.headline,
    color: theme.colors.secondaryLabel,
  },
  unlockButtonTextUnlocked: {
    color: theme.colors.white,
  },
  matchesContainer: {
    paddingHorizontal: theme.layout.containerPadding,
  },
  matchCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    position: 'relative',
    ...theme.shadows.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  compatibilityBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  compatibilityText: {
    ...theme.typography.title2,
    color: theme.colors.white,
    fontWeight: '700',
  },
  compatibilityLabel: {
    ...theme.typography.caption1,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricsContainer: {
    marginBottom: theme.spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  metricLabel: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  metricValue: {
    ...theme.typography.callout,
    color: theme.colors.label,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  traitsContainer: {
    marginBottom: theme.spacing.lg,
  },
  traitsLabel: {
    ...theme.typography.headline,
    color: theme.colors.label,
    marginBottom: theme.spacing.md,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  traitTag: {
    backgroundColor: theme.colors.secondarySystemBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  traitText: {
    ...theme.typography.caption1,
    color: theme.colors.label,
    fontWeight: '500',
  },
  interestsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.separator,
    paddingTop: theme.spacing.lg,
  },
  interestsLabel: {
    ...theme.typography.headline,
    color: theme.colors.label,
    marginBottom: theme.spacing.md,
  },
  interestsText: {
    ...theme.typography.body,
    color: theme.colors.secondaryLabel,
    lineHeight: 22,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  lockedText: {
    ...theme.typography.headline,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: theme.spacing.huge,
  },
});