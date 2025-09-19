import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { supabaseService, User, Reflection, UserStats } from '../services/supabase.production';

interface ProfileGenerationScreenProps {
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
}

export const ProfileGenerationScreen: React.FC<ProfileGenerationScreenProps> = ({ 
  currentUser, 
  onProfileUpdated 
}) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [generatedBio, setGeneratedBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user reflections
      const userReflections = await supabaseService.getUserReflections(currentUser.id, 20);
      setReflections(userReflections);

      // Load user stats
      const stats = await supabaseService.getUserStats(currentUser.id);
      setUserStats(stats);

      // Generate profile data from reflections
      generateProfileFromReflections(userReflections);

      // Set existing bio
      setBioText(currentUser.bio || '');
    } catch (error: any) {
      console.error('Load user data error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const generateProfileFromReflections = (userReflections: Reflection[]) => {
    if (userReflections.length === 0) return;

    // Extract common themes and topics from reflections
    const allTopics = userReflections.flatMap(r => r.topic_tags || []);
    const topicCounts: Record<string, number> = {};
    
    allTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    // Get most mentioned topics as interests
    const topInterests = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([topic]) => topic);
    
    setInterests(topInterests);

    // Generate a bio based on reflection patterns and themes
    const bioSuggestion = generateBioFromReflections(userReflections, topInterests);
    setGeneratedBio(bioSuggestion);
  };

  const generateBioFromReflections = (userReflections: Reflection[], topInterests: string[]): string => {
    const reflectionCount = userReflections.length;
    const avgWordCount = Math.round(
      userReflections.reduce((sum, r) => sum + r.word_count, 0) / reflectionCount
    );

    // Create personality traits based on reflection patterns
    const traits = [];
    
    if (avgWordCount > 100) {
      traits.push('thoughtful');
    } else if (avgWordCount > 50) {
      traits.push('concise');
    }

    const recentReflections = userReflections.slice(0, 5);
    const commonWords = extractCommonThemes(recentReflections);

    // Build a bio suggestion
    let bio = `Someone who enjoys ${topInterests.slice(0, 3).join(', ')}`;
    
    if (traits.length > 0) {
      bio += ` and values ${traits.join(' and ')} conversations`;
    }
    
    if (commonWords.length > 0) {
      bio += `. Often reflects on ${commonWords.slice(0, 2).join(' and ')}.`;
    }

    // Add reflection streak if significant
    if (userStats && userStats.reflection_streak > 7) {
      bio += ` Currently on a ${userStats.reflection_streak}-day reflection streak!`;
    }

    return bio;
  };

  const extractCommonThemes = (reflections: Reflection[]): string[] => {
    // Simple word frequency analysis
    const words = reflections
      .map(r => r.answer_text.toLowerCase())
      .join(' ')
      .split(/\W+/)
      .filter(word => 
        word.length > 4 && 
        !['that', 'with', 'have', 'this', 'they', 'from', 'been', 'were', 'some'].includes(word)
      );

    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updatedUser = await supabaseService.updateUser(currentUser.id, {
        bio: bioText,
        interests_tags: interests,
      });

      onProfileUpdated(updatedUser);
      Alert.alert(
        'Profile Updated!',
        'Your profile has been updated with insights from your reflections.',
        [{ text: 'Great!' }]
      );
    } catch (error: any) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUseGeneratedBio = () => {
    setBioText(generatedBio);
    setEditingBio(true);
  };

  const addInterest = (interest: string) => {
    if (!interests.includes(interest) && interests.length < 10) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Analyzing your reflections...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Build Your Profile</Text>
        <Text style={styles.subtitle}>
          Based on {reflections.length} reflections, here's what we learned about you
        </Text>
      </View>

      {/* Stats Summary */}
      {userStats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Reflection Journey</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.total_reflections}</Text>
              <Text style={styles.statLabel}>Reflections</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.reflection_streak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round(userStats.authenticity_score * 100)}%
              </Text>
              <Text style={styles.statLabel}>Authenticity</Text>
            </View>
          </View>
        </View>
      )}

      {/* Generated Bio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested Bio</Text>
        <View style={styles.bioCard}>
          <Text style={styles.generatedBio}>{generatedBio}</Text>
          <TouchableOpacity style={styles.useBioButton} onPress={handleUseGeneratedBio}>
            <Text style={styles.useBioButtonText}>Use This Bio</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio Editor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Bio</Text>
        <TouchableOpacity 
          style={styles.bioEditor}
          onPress={() => setEditingBio(true)}
        >
          {editingBio ? (
            <TextInput
              style={styles.bioTextInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Tell others about yourself..."
              multiline
              maxLength={300}
              autoFocus
              onBlur={() => setEditingBio(false)}
            />
          ) : (
            <Text style={[styles.bioText, !bioText && styles.bioPlaceholder]}>
              {bioText || 'Tap to add your bio...'}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.characterCount}>{bioText.length}/300</Text>
      </View>

      {/* Interests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Interests</Text>
        <Text style={styles.sectionSubtitle}>
          Based on topics you reflect on most
        </Text>
        
        <View style={styles.interestsList}>
          {interests.map((interest, index) => (
            <TouchableOpacity
              key={index}
              style={styles.interestTag}
              onPress={() => removeInterest(interest)}
            >
              <Text style={styles.interestText}>{interest}</Text>
              <Text style={styles.removeInterest}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.interestHint}>
          Tap an interest to remove it
        </Text>
      </View>

      {/* Recent Reflections Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reflections</Text>
        {reflections.slice(0, 3).map((reflection) => (
          <View key={reflection.id} style={styles.reflectionPreview}>
            <Text style={styles.reflectionQuestion} numberOfLines={1}>
              {reflection.question_text}
            </Text>
            <Text style={styles.reflectionAnswer} numberOfLines={2}>
              {reflection.answer_text}
            </Text>
            <Text style={styles.reflectionMeta}>
              {reflection.word_count} words • {reflection.hearts_count} ❤️
            </Text>
          </View>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSaveProfile}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving Profile...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loading: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: '50%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  bioCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  generatedBio: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  useBioButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  useBioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bioEditor: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bioTextInput: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    minHeight: 48,
  },
  bioText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
  bioPlaceholder: {
    color: '#8E8E93',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  interestTag: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interestText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  removeInterest: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  interestHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  reflectionPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reflectionQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
  },
  reflectionAnswer: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 8,
  },
  reflectionMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});