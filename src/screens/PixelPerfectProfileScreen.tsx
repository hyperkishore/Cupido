import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export const PixelPerfectProfileScreen = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Authenticity Score Section */}
      <View style={styles.authenticitySection}>
        <Text style={styles.authenticityScore}>80%</Text>
        <Text style={styles.authenticityLabel}>Authenticity Score</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>25</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
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
          <View style={styles.traitItem}>
            <Text style={styles.traitPercentage}>92%</Text>
            <Text style={styles.traitName}>Authenticity</Text>
          </View>
          <View style={styles.traitItem}>
            <Text style={styles.traitPercentage}>88%</Text>
            <Text style={styles.traitName}>Empathy</Text>
          </View>
          <View style={styles.traitItem}>
            <Text style={styles.traitPercentage}>85%</Text>
            <Text style={styles.traitName}>Curiosity</Text>
          </View>
          <View style={styles.traitItem}>
            <Text style={styles.traitPercentage}>79%</Text>
            <Text style={styles.traitName}>Openness</Text>
          </View>
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
    fontSize: 64,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 64,
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
    fontSize: 24,
    fontWeight: '700',
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
    fontSize: 22,
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
    fontSize: 36,
    fontWeight: '600',
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
});