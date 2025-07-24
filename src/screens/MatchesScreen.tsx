import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Match {
  id: string;
  profileMatch: number;
  socialAlignment: number;
  overallCompatibility: number;
  sharedInterests: string;
  isLocked: boolean;
  pointsNeeded?: number;
}

export const MatchesScreen = () => {
  const [userPoints] = useState(25);
  const [matches] = useState<Match[]>([
    {
      id: '1',
      profileMatch: 87,
      socialAlignment: 0,
      overallCompatibility: 44,
      sharedInterests: "Shares professional ambition and creative interests. Strong alignment in career goals and lifestyle preferences.",
      isLocked: true,
      pointsNeeded: 50,
    },
    {
      id: '2',
      profileMatch: 92,
      socialAlignment: 76,
      overallCompatibility: 84,
      sharedInterests: "Deep connection through shared values about authenticity and vulnerability. Similar communication styles.",
      isLocked: true,
      pointsNeeded: 50,
    },
    {
      id: '3',
      profileMatch: 78,
      socialAlignment: 82,
      overallCompatibility: 80,
      sharedInterests: "Both value personal growth and continuous learning. Aligned on relationship goals and life philosophy.",
      isLocked: true,
      pointsNeeded: 50,
    },
  ]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.unlockCard}>
        <Text style={styles.unlockTitle}>Unlock 1-1 Chats</Text>
        <Text style={styles.unlockDescription}>
          Complete more reflections and receive hearts on your responses to unlock anonymous 1-1 chats.
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>{userPoints}/50 points</Text>
        </View>
      </View>

      {matches.map((match) => (
        <View key={match.id} style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>Anonymous Match</Text>
            <Text style={styles.compatibilityText}>
              {match.overallCompatibility}% Compatible
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Profile Match</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {match.profileMatch}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Social Alignment</Text>
              <Text style={[styles.statValue, { color: match.socialAlignment > 0 ? '#4CAF50' : '#999999' }]}>
                {match.socialAlignment}%
              </Text>
            </View>
          </View>

          <View style={styles.interestsSection}>
            <Text style={styles.interestsTitle}>Shared Interests From:</Text>
            <Text style={styles.interestsText}>{match.sharedInterests}</Text>
          </View>

          {match.isLocked ? (
            <View style={styles.lockedContainer}>
              <Text style={styles.lockedText}>
                Locked - Need {match.pointsNeeded} points
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.chatButton}>
              <Text style={styles.chatButtonText}>Start Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  unlockCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  unlockDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: {
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  compatibilityText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  interestsSection: {
    marginBottom: 20,
  },
  interestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  interestsText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  lockedContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
  },
});