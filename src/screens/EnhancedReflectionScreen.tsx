import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { supabaseService, User, DailyQuestion, Reflection, UserStats } from '../services/supabase.production';
import { CleanVoiceInput } from '../components/CleanVoiceInput';

interface EnhancedReflectionScreenProps {
  currentUser: User;
}

export const EnhancedReflectionScreen: React.FC<EnhancedReflectionScreenProps> = ({ currentUser }) => {
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<DailyQuestion | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentReflections, setRecentReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user stats for streak tracking
      const stats = await supabaseService.getUserStats(currentUser.id);
      setUserStats(stats);

      // Load personalized question
      const question = await supabaseService.getPersonalizedQuestion(currentUser.id);
      setCurrentQuestion(question);

      // Load recent reflections for history
      const reflections = await supabaseService.getUserReflections(currentUser.id, 5);
      setRecentReflections(reflections);
    } catch (error: any) {
      console.error('Load user data error:', error);
      Alert.alert('Error', 'Failed to load reflection data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answer.trim() || submitting) return;

    setSubmitting(true);
    try {
      // Create reflection
      const newReflection = await supabaseService.createReflection({
        user_id: currentUser.id,
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        answer_text: answer.trim(),
        topic_tags: currentQuestion.tags || [],
        is_public: true, // Default to public for now
      });

      Alert.alert(
        '✨ Reflection Saved!',
        `Great insight! You've shared ${newReflection.word_count} words of reflection.`,
        [{ text: 'Continue', onPress: handleContinue }]
      );

      // Update local state
      setRecentReflections(prev => [newReflection, ...prev.slice(0, 4)]);
      
      // Refresh user stats to show updated streak
      const updatedStats = await supabaseService.getUserStats(currentUser.id);
      setUserStats(updatedStats);

    } catch (error: any) {
      console.error('Submit answer error:', error);
      Alert.alert('Error', 'Failed to save your reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setAnswer('');
    
    // Load a new question
    try {
      const newQuestion = await supabaseService.getPersonalizedQuestion(currentUser.id);
      setCurrentQuestion(newQuestion);
    } catch (error) {
      console.error('Load new question error:', error);
    }
  };

  const handleSkip = async () => {
    // TODO: Track skipped questions for better personalization
    handleContinue();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading your reflection...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No More Questions</Text>
          <Text style={styles.emptySubtitle}>
            You've answered all available questions for today!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadUserData}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Streak & Stats Header */}
        {userStats && (
          <View style={styles.statsHeader}>
            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{userStats.reflection_streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.total_reflections}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.longest_streak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Math.round(userStats.authenticity_score * 100)}%</Text>
                <Text style={styles.statLabel}>Authenticity</Text>
              </View>
            </View>
          </View>
        )}

        {/* Question Theme Tag */}
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>{currentQuestion.theme}</Text>
          {currentQuestion.emotional_depth && (
            <Text style={styles.depthTag}>{currentQuestion.emotional_depth} depth</Text>
          )}
        </View>

        {/* Question */}
        <Text style={styles.question}>
          {currentQuestion.question}
        </Text>

        {/* Voice Input */}
        <CleanVoiceInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Share your thoughts..."
          maxLength={1000}
        />

        {/* Action Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.shareButton,
              (answer.trim().length === 0 || submitting) && styles.shareButtonDisabled
            ]}
            onPress={handleSubmitAnswer}
            disabled={answer.trim().length === 0 || submitting}
          >
            <Text style={[
              styles.shareText,
              (answer.trim().length === 0 || submitting) && styles.shareTextDisabled
            ]}>
              {submitting ? 'Saving...' : `Share (${answer.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reflections Preview */}
        {recentReflections.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Reflections</Text>
            {recentReflections.slice(0, 3).map((reflection, index) => (
              <View key={reflection.id} style={styles.historyItem}>
                <Text style={styles.historyQuestion} numberOfLines={1}>
                  {reflection.question_text}
                </Text>
                <Text style={styles.historyAnswer} numberOfLines={2}>
                  {reflection.answer_text}
                </Text>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyDate}>
                    {new Date(reflection.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.historyHearts}>
                    ❤️ {reflection.hearts_count}
                  </Text>
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Reflections →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 32,
    paddingTop: 60,
  },
  loading: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: '50%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsHeader: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B35',
  },
  streakLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  streakEmoji: {
    fontSize: 20,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  tag: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  depthTag: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  question: {
    fontSize: 22,
    lineHeight: 30,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  shareButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  shareButtonDisabled: {
    opacity: 0.4,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareTextDisabled: {
    color: '#CCCCCC',
  },
  historySection: {
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
  },
  historyAnswer: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 8,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  historyHearts: {
    fontSize: 12,
    color: '#FF6B35',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});