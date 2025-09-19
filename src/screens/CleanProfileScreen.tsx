import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppState } from '../contexts/AppStateContext';
import { theme } from '../design-system/tokens';

export const CleanProfileScreen = () => {
  const { state, dispatch } = useAppState();
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_PROGRESS' });
            Alert.alert('Progress Reset', 'Your progress has been reset successfully.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your reflection data can be exported for personal use or migration to other platforms.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Feature Coming Soon', 'Data export will be available in a future update.') },
      ]
    );
  };

  const achievements = [
    { id: 1, name: 'First Reflection', description: 'Completed your first daily reflection', earned: state.answers.length > 0, icon: '✨' },
    { id: 2, name: 'Consistent Reflector', description: 'Maintain a 3-day streak', earned: state.userStats.currentStreak >= 3, icon: '🔥' },
    { id: 3, name: 'Deep Thinker', description: 'Answer 10 reflection questions', earned: state.answers.length >= 10, icon: '🧠' },
    { id: 4, name: 'Heart Giver', description: 'Like 20 community responses', earned: state.answers.filter(a => a.isLiked).length >= 20, icon: '❤️' },
    { id: 5, name: 'Authentic Soul', description: 'Reach 100 total points', earned: state.userStats.totalPoints >= 100, icon: '🌟' },
  ];

  const personalityInsights = [
    { trait: 'Authenticity', score: Math.min(95, 65 + state.answers.length * 2), description: 'You show genuine vulnerability in your responses' },
    { trait: 'Emotional Depth', score: Math.min(90, 45 + state.answers.length * 3), description: 'Your reflections demonstrate emotional intelligence' },
    { trait: 'Growth Mindset', score: Math.min(88, 70 + state.userStats.currentStreak * 4), description: 'You consistently engage in self-reflection' },
    { trait: 'Empathy', score: Math.min(92, 80 + state.answers.filter(a => a.isLiked).length), description: 'You appreciate others\' perspectives' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>You</Text>
          </View>
          <Text style={styles.userName}>Your Journey</Text>
          <Text style={styles.userSubtitle}>
            Building authentic connections through self-reflection
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.answers.length}</Text>
              <Text style={styles.statLabel}>Reflections</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.userStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.answers.filter(a => a.isLiked).length}</Text>
              <Text style={styles.statLabel}>Hearts Given</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.cardTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  achievement.earned ? styles.achievementEarned : styles.achievementLocked,
                ]}
              >
                <Text style={[
                  styles.achievementIcon,
                  !achievement.earned && styles.achievementIconLocked
                ]}>
                  {achievement.earned ? achievement.icon : '🔒'}
                </Text>
                <View style={styles.achievementContent}>
                  <Text style={[
                    styles.achievementName,
                    !achievement.earned && styles.achievementNameLocked
                  ]}>
                    {achievement.name}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.earned && styles.achievementDescriptionLocked
                  ]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Personality Insights */}
        <View style={styles.personalityCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personality Insights</Text>
            <TouchableOpacity
              onPress={() => setShowAdvancedStats(!showAdvancedStats)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {showAdvancedStats ? 'Simple' : 'Detailed'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.personalityList}>
            {personalityInsights.map((insight, index) => (
              <View key={index} style={styles.personalityItem}>
                <View style={styles.personalityHeader}>
                  <Text style={styles.personalityTrait}>{insight.trait}</Text>
                  <Text style={styles.personalityScore}>{insight.score}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { width: `${insight.score}%` }
                      ]} 
                    />
                  </View>
                </View>
                {showAdvancedStats && (
                  <Text style={styles.personalityDescription}>
                    {insight.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
              <Text style={styles.settingIcon}>📄</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Export Data</Text>
                <Text style={styles.settingDescription}>Download your reflection data</Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>Daily reflection reminders</Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🎨</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingDescription}>Customize your experience</Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, styles.dangerSetting]} 
              onPress={handleResetProgress}
            >
              <Text style={styles.settingIcon}>🔄</Text>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Reset Progress</Text>
                <Text style={styles.settingDescription}>Clear all data and start over</Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: theme.layout.containerPadding,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  avatarText: {
    ...theme.typography.title2,
    color: theme.colors.white,
    fontWeight: '600',
  },
  userName: {
    ...theme.typography.title1,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  userSubtitle: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.layout.containerPadding,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardTitle: {
    ...theme.typography.title3,
    color: theme.colors.label,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...theme.typography.title1,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
  },
  achievementsCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.layout.containerPadding,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  achievementsList: {
    gap: theme.spacing.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  achievementEarned: {
    backgroundColor: theme.colors.successBackground,
    borderColor: theme.colors.success,
  },
  achievementLocked: {
    backgroundColor: theme.colors.gray100,
    borderColor: theme.colors.gray300,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: theme.spacing.lg,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    ...theme.typography.headline,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  achievementNameLocked: {
    color: theme.colors.tertiaryLabel,
  },
  achievementDescription: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
  },
  achievementDescriptionLocked: {
    color: theme.colors.tertiaryLabel,
  },
  personalityCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.layout.containerPadding,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  toggleButton: {
    backgroundColor: theme.colors.secondarySystemBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  toggleButtonText: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  personalityList: {
    gap: theme.spacing.lg,
  },
  personalityItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
    paddingBottom: theme.spacing.lg,
  },
  personalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  personalityTrait: {
    ...theme.typography.headline,
    color: theme.colors.label,
  },
  personalityScore: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  personalityDescription: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
    lineHeight: 16,
  },
  settingsCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.layout.containerPadding,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  settingsList: {
    gap: theme.spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  dangerSetting: {
    backgroundColor: theme.colors.errorBackground,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: theme.spacing.lg,
    width: 32,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...theme.typography.body,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  dangerText: {
    color: theme.colors.error,
  },
  settingDescription: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
  },
  settingArrow: {
    ...theme.typography.body,
    color: theme.colors.tertiaryLabel,
    fontSize: 18,
  },
  bottomSpacer: {
    height: theme.spacing.huge,
  },
});