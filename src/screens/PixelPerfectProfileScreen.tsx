import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { personalityInsightsService, PersonalityProfile } from '../services/personalityInsightsService';
import { useAuth } from '../contexts/AuthContext';

export const PixelPerfectProfileScreen = () => {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadPersonalityProfile();
  }, []);

  const loadPersonalityProfile = async () => {
    try {
      await personalityInsightsService.initialize();
      const personalityProfile = await personalityInsightsService.getPersonalityProfile();
      setProfile(personalityProfile);
    } catch (error) {
      console.error('Error loading personality profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading personality insights...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Start reflecting to build your personality profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Authenticity Score Section */}
      <View style={styles.authenticitySection}>
        <Text style={styles.authenticityScore}>{profile.authenticityScore}%</Text>
        <Text style={styles.authenticityLabel}>Authenticity Score</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.authenticityScore}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.totalReflections}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
        </View>
      </View>

      {/* Points Progress Section */}
      <View style={styles.pointsSection}>
        <View style={styles.pointsInfo}>
          <View style={styles.orangeDot} />
          <Text style={styles.pointsText}>25 points to unlock chats</Text>
        </View>
        <Text style={styles.pointsDescription}>
          Continue sharing authentic responses to unlock 1-1 anonymous chats
        </Text>
      </View>

      {/* Social Connections Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Connections</Text>
        <TouchableOpacity style={styles.socialCard}>
          <Text style={styles.socialScore}>0/105</Text>
          <Text style={styles.socialLabel}>Compatibility Score</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Personality Insights Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personality Insights</Text>
        <View style={styles.personalityGrid}>
          {profile.traits.map((trait, index) => (
            <View key={trait.name} style={styles.traitItem}>
              <Text style={styles.traitPercentage}>{Math.round(trait.percentage)}%</Text>
              <Text style={styles.traitName}>{trait.name}</Text>
            </View>
          ))}
        </View>
        
        {/* Insights Summary */}
        <View style={styles.insightsSummarySection}>
          <Text style={styles.insightsSummaryText}>{profile.insightsSummary}</Text>
          <Text style={styles.lastUpdatedText}>
            Last updated: {profile.lastAnalyzed.toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementBullet}>•</Text>
            <Text style={styles.achievementName}>First Steps</Text>
          </View>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementBullet}>•</Text>
            <Text style={styles.achievementName}>Week Warrior</Text>
          </View>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementBullet}>•</Text>
            <Text style={styles.achievementName}>Voice Pioneer</Text>
          </View>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementBullet}>•</Text>
            <Text style={styles.achievementName}>Authentic Soul</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>Phone number</Text>
          <Text style={styles.accountValue}>{user?.phoneNumber ?? 'Not set'}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  authenticitySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  authenticityScore: {
    fontSize: 72,
    fontWeight: '300',
    color: '#000000',
    lineHeight: 72,
  },
  authenticityLabel: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 32,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  pointsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
  pointsText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  pointsDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 12,
  },
  socialScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34C759',
  },
  socialLabel: {
    fontSize: 17,
    color: '#8E8E93',
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  traitItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
  },
  traitPercentage: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    marginBottom: 4,
  },
  traitName: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementBullet: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '600',
  },
  achievementName: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
  },
  bottomPadding: {
    height: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
  },
  insightsSummarySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E7',
  },
  insightsSummaryText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 8,
  },
  lastUpdatedText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  accountCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 20,
    gap: 12,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  accountValue: {
    fontSize: 16,
    color: '#000000',
  },
  logoutButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});
