import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PersonalityTrait {
  name: string;
  percentage: number;
}

interface Achievement {
  name: string;
  description?: string;
}

export const ProfileScreen = () => {
  const [authenticityScore] = useState(80);
  const [totalPoints] = useState(25);
  const [responses] = useState(12);
  const [connected] = useState(0);
  const [personalityTraits] = useState<PersonalityTrait[]>([
    { name: 'Authenticity', percentage: 92 },
    { name: 'Empathy', percentage: 88 },
    { name: 'Curiosity', percentage: 85 },
    { name: 'Openness', percentage: 79 },
  ]);
  const [achievements] = useState<Achievement[]>([
    { name: 'First Steps' },
    { name: 'Week Warrior' },
    { name: 'Voice Pioneer' },
    { name: 'Authentic Soul' },
  ]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.authenticitySection}>
        <Text style={styles.authenticityScore}>{authenticityScore}%</Text>
        <Text style={styles.authenticityLabel}>Authenticity Score</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{responses}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{connected}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
        </View>
      </View>

      <View style={styles.pointsSection}>
        <View style={styles.pointsInfo}>
          <Ionicons name="ellipse" size={8} color="#FFA500" />
          <Text style={styles.pointsText}>{totalPoints} points to unlock chats</Text>
        </View>
        <Text style={styles.pointsDescription}>
          Continue sharing authentic responses to unlock 1-1 anonymous chats
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Connections</Text>
        <TouchableOpacity style={styles.socialCard}>
          <Text style={styles.socialScore}>0/105</Text>
          <Text style={styles.socialLabel}>Compatibility Score</Text>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personality Insights</Text>
        <View style={styles.personalityGrid}>
          {personalityTraits.map((trait, index) => (
            <View key={index} style={styles.traitItem}>
              <Text style={styles.traitPercentage}>{trait.percentage}%</Text>
              <Text style={styles.traitName}>{trait.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Text style={styles.achievementName}>• {achievement.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  authenticitySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  authenticityScore: {
    fontSize: 72,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 72,
  },
  authenticityLabel: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 32,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  pointsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  pointsDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 16,
  },
  socialScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4CAF50',
  },
  socialLabel: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  traitItem: {
    width: '45%',
    alignItems: 'center',
    marginBottom: 20,
  },
  traitPercentage: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  traitName: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    paddingVertical: 8,
  },
  achievementName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});