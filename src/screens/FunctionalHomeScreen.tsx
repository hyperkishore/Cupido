import React, { useState } from 'react';
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

export const FunctionalHomeScreen = () => {
  const { state, dispatch } = useAppState();
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(true);
  const [showCommunityPrompt, setShowCommunityPrompt] = useState(true);
  const [likeAnimations, setLikeAnimations] = useState<{[key: string]: Animated.Value}>({});

  const handleLikeAnswer = (answerId: string) => {
    // Create animation for the heart
    if (!likeAnimations[answerId]) {
      likeAnimations[answerId] = new Animated.Value(1);
    }

    const animation = likeAnimations[answerId];
    
    // Animate the heart
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Update the state
    dispatch({ type: 'LIKE_ANSWER', payload: answerId });
  };

  const handleConnectLinkedIn = () => {
    Alert.alert(
      'Connect LinkedIn',
      'This feature would connect to your LinkedIn profile to find people with similar professional interests.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect', onPress: () => {
          setShowLinkedInPrompt(false);
          Alert.alert('Success!', 'LinkedIn connection feature enabled.');
        }},
      ]
    );
  };

  const handleAskCommunity = () => {
    Alert.alert(
      'Ask the Community',
      'What question would you like to ask the Cupido community?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Ask Question', onPress: () => {
          setShowCommunityPrompt(false);
          Alert.alert('Posted!', 'Your question has been shared with the community.');
        }},
      ]
    );
  };

  const renderAnswer = (answer: any, index: number) => (
    <View key={answer.id}>
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>{answer.questionText}</Text>
          <Text style={styles.timestamp}>
            {new Date(answer.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ago
          </Text>
        </View>
        
        <Text style={styles.answerText}>{answer.text}</Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{answer.category}</Text>
          </View>
          <TouchableOpacity 
            style={styles.heartContainer}
            onPress={() => handleLikeAnswer(answer.id)}
            activeOpacity={0.7}
          >
            <Animated.View style={{
              transform: [{ scale: likeAnimations[answer.id] || new Animated.Value(1) }]
            }}>
              <Text style={[
                styles.heartIcon, 
                answer.isLiked && styles.heartIconLiked
              ]}>
                {answer.isLiked ? '♥' : '♡'}
              </Text>
            </Animated.View>
            <Text style={styles.heartCount}>{answer.hearts}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LinkedIn Prompt after first question */}
      {index === 0 && showLinkedInPrompt && (
        <View style={styles.promptCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowLinkedInPrompt(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <View style={styles.promptContent}>
            <View style={styles.linkedinIconContainer}>
              <Text style={styles.linkedinIcon}>in</Text>
            </View>
            <View style={styles.promptTextContainer}>
              <Text style={styles.promptTitle}>Connect LinkedIn</Text>
              <Text style={styles.promptSubtitle}>
                Find people similar to your professional network
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={handleConnectLinkedIn}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Community Prompt after third question */}
      {index === 2 && showCommunityPrompt && (
        <View style={styles.promptCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowCommunityPrompt(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <View style={styles.promptContent}>
            <Text style={styles.checkIcon}>✓</Text>
            <View style={styles.promptTextContainer}>
              <Text style={styles.promptTitle}>Ask the Community</Text>
              <Text style={styles.promptSubtitle}>
                Share a question that sparks meaningful conversations
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.askButton}
              onPress={handleAskCommunity}
            >
              <Text style={styles.askButtonText}>Ask</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {state.answers.map((answer, index) => renderAnswer(answer, index))}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  questionHeader: {
    marginBottom: 12,
    position: 'relative',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 24,
    paddingRight: 60,
  },
  timestamp: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 15,
    color: '#8E8E93',
  },
  answerText: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 16,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  heartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heartIcon: {
    fontSize: 16,
    color: '#C7C7CC',
  },
  heartIconLiked: {
    color: '#FF3B30',
  },
  heartCount: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  promptCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 1,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: '#8E8E93',
    fontWeight: '300',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkedinIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#0A66C2',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkedinIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  checkIcon: {
    fontSize: 20,
    color: '#34C759',
    fontWeight: 'bold',
  },
  promptTextContainer: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  promptSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  connectButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  askButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  bottomPadding: {
    height: 100,
  },
});