// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Card } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { WeeklyDigestService } from '../services/weeklyDigest';
import { WeeklyDigest } from '../types';
import { theme } from '../utils/theme';

export const DigestScreen: React.FC = () => {
  const { user } = useAuth();
  const [currentDigest, setCurrentDigest] = useState<WeeklyDigest | null>(null);
  const [pastDigests, setPastDigests] = useState<WeeklyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadDigests();
    }
  }, [user]);

  const loadDigests = async () => {
    if (!user) return;

    try {
      const [current, past] = await Promise.all([
        WeeklyDigestService.getCurrentWeekDigest(user.id),
        WeeklyDigestService.getUserDigests(user.id, 10),
      ]);

      setCurrentDigest(current);
      setPastDigests(past.filter(d => d.id !== current?.id));
    } catch (error) {
      console.error('Error loading digests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDigest = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const digest = await WeeklyDigestService.generateWeeklyDigest(user.id);
      setCurrentDigest(digest);
      Alert.alert('Success', 'Your weekly digest has been generated!');
    } catch (error) {
      console.error('Error generating digest:', error);
      Alert.alert('Error', 'Failed to generate weekly digest');
    } finally {
      setGenerating(false);
    }
  };

  const checkCanGenerate = async () => {
    if (!user) return;

    const canGenerate = await WeeklyDigestService.shouldGenerateDigest(user.id);
    if (!canGenerate) {
      Alert.alert(
        'Not Available',
        'Weekly digests are generated on Mondays. Check back then!'
      );
      return;
    }

    generateDigest();
  };

  const renderDigestCard = (digest: WeeklyDigest, isCurrent: boolean = false) => (
    <Card key={digest.id} style={[styles.digestCard, isCurrent && styles.currentDigestCard]}>
      <View style={styles.digestHeader}>
        <Text style={[styles.digestTitle, isCurrent && styles.currentDigestTitle]}>
          {isCurrent ? 'This Week' : 'Week of'} {WeeklyDigestService.formatWeekString(digest.week)}
        </Text>
        {isCurrent && <Text style={styles.currentLabel}>Current</Text>}
      </View>

      <View style={styles.digestStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{digest.matches}</Text>
          <Text style={styles.statLabel}>New Matches</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{digest.streakInfo.current}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{digest.streakInfo.longest}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Weekly Insights</Text>
        {digest.insights.map((insight, index) => (
          <Text key={index} style={styles.insightText}>
            {insight}
          </Text>
        ))}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your digests...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Digest</Text>
        <Text style={styles.subtitle}>
          Your personal insights and progress
        </Text>
      </View>

      {!currentDigest ? (
        <Card style={styles.noDigestCard}>
          <Text style={styles.noDigestTitle}>No Digest Yet</Text>
          <Text style={styles.noDigestText}>
            Your weekly digest will be available on Monday, summarizing your self-discovery journey.
          </Text>
          <Button
            title={generating ? 'Generating...' : 'Generate Digest'}
            onPress={checkCanGenerate}
            disabled={generating}
            style={styles.generateButton}
          />
        </Card>
      ) : (
        renderDigestCard(currentDigest, true)
      )}

      {pastDigests.length > 0 && (
        <View style={styles.pastDigestsContainer}>
          <Text style={styles.pastDigestsTitle}>Past Digests</Text>
          {pastDigests.map(digest => renderDigestCard(digest))}
        </View>
      )}

      {pastDigests.length === 0 && currentDigest && (
        <Card style={styles.noHistoryCard}>
          <Text style={styles.noHistoryText}>
            Keep completing daily reflections to build your digest history!
          </Text>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  noDigestCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  noDigestTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  noDigestText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  generateButton: {
    minWidth: 200,
  },
  digestCard: {
    marginBottom: theme.spacing.lg,
  },
  currentDigestCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  digestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  digestTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  currentDigestTitle: {
    color: theme.colors.primary,
  },
  currentLabel: {
    ...theme.typography.small,
    color: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    fontWeight: '600',
  },
  digestStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  insightsContainer: {
    marginTop: theme.spacing.md,
  },
  insightsTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  insightText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  pastDigestsContainer: {
    marginTop: theme.spacing.xl,
  },
  pastDigestsTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  noHistoryCard: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  noHistoryText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});