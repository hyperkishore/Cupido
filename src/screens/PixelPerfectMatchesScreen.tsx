import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export const PixelPerfectMatchesScreen = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.spacer} />
      </View>

      {/* Unlock Progress Card */}
      <View style={styles.unlockCard}>
        <Text style={styles.unlockTitle}>Unlock 1-1 Chats</Text>
        <Text style={styles.unlockDescription}>
          Complete more reflections and receive hearts on your responses to unlock anonymous 1-1 chats.
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>25/50 points</Text>
        </View>
      </View>

      {/* Match Card */}
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>Anonymous Match</Text>
          <Text style={styles.compatibilityText}>44% Compatible</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Profile Match</Text>
            <Text style={styles.statValueGreen}>87%</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Social Alignment</Text>
            <Text style={styles.statValueGray}>0%</Text>
          </View>
        </View>

        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>Shared Interests From:</Text>
          <Text style={styles.interestsText}>
            Shares professional ambition and creative interests. Strong alignment in career goals and lifestyle preferences.
          </Text>
        </View>

        <View style={styles.lockedContainer}>
          <Text style={styles.lockedText}>Locked - Need 50 points</Text>
        </View>
      </View>

      {/* Additional Match Cards would go here */}
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>Anonymous Match</Text>
          <Text style={styles.compatibilityText}>84% Compatible</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Profile Match</Text>
            <Text style={styles.statValueGreen}>92%</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Social Alignment</Text>
            <Text style={styles.statValueGreen}>76%</Text>
          </View>
        </View>

        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>Shared Interests From:</Text>
          <Text style={styles.interestsText}>
            Deep connection through shared values about authenticity and vulnerability. Similar communication styles.
          </Text>
        </View>

        <View style={styles.lockedContainer}>
          <Text style={styles.lockedText}>Locked - Need 50 points</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backIcon: {
    fontSize: 24,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  spacer: {
    width: 24,
  },
  unlockCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 16,
    marginTop: 16,
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
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#FF9500',
  },
  progressText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    color: '#34C759',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statColumn: {
    flex: 1,
  },
  statLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 28,
    fontWeight: '600',
    color: '#34C759',
  },
  statValueGray: {
    fontSize: 28,
    fontWeight: '600',
    color: '#8E8E93',
  },
  interestsSection: {
    marginBottom: 24,
  },
  interestsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  interestsText: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  lockedContainer: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  bottomPadding: {
    height: 100,
  },
});