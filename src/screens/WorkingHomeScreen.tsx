import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

// Mock data since JSON loading might be causing issues
const mockQuestions = [
  {
    id: 'q1',
    text: "What made you smile today, and why did it resonate with you?",
    category: 'PERSONAL GROWTH'
  },
  {
    id: 'q2', 
    text: "What does intimacy mean to you beyond physical connection?",
    category: 'RELATIONSHIPS'
  },
  {
    id: 'q3',
    text: "What's a belief you held strongly that has evolved over time?",
    category: 'VALUES'
  }
];

interface Answer {
  id: string;
  questionId: string;
  text: string;
  category: string;
  timestamp: string;
  hearts: number;
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'just now';
  if (diffInHours === 1) return '1h ago';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1d ago';
  return `${diffInDays}d ago`;
};

export const WorkingHomeScreen = () => {
  const [answers] = useState<Answer[]>([
    {
      id: 'a1',
      questionId: 'q1',
      text: "A stranger helped an elderly person with groceries. It reminded me that small acts of kindness create ripples of goodness in the world.",
      category: 'PERSONAL GROWTH',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hearts: 12,
    },
    {
      id: 'a2',
      questionId: 'q2',
      text: "Being able to share my weird thoughts at 3am and having someone not just listen, but add their own weird thoughts to the mix.",
      category: 'RELATIONSHIPS',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      hearts: 8,
    },
    {
      id: 'a3',
      questionId: 'q3',
      text: "I used to think vulnerability was weakness. Now I see it as the bravest thing you can do - it's how we truly connect with others.",
      category: 'VALUES',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      hearts: 15,
    },
  ]);

  const getQuestionText = (questionId: string) => {
    const question = mockQuestions.find(q => q.id === questionId);
    return question ? question.text : 'Question not found';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {answers.map((answer, index) => (
        <View key={answer.id}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              {getQuestionText(answer.questionId)}
            </Text>
            <Text style={styles.timestamp}>{formatTimeAgo(answer.timestamp)}</Text>
            
            <Text style={styles.answerText}>{answer.text}</Text>
            
            <View style={styles.questionFooter}>
              <TouchableOpacity style={styles.categoryTag}>
                <Text style={styles.categoryText}>{answer.category}</Text>
              </TouchableOpacity>
              <View style={styles.heartContainer}>
                <Text style={styles.heartIcon}>♥</Text>
                <Text style={styles.heartCount}>{answer.hearts}</Text>
              </View>
            </View>
          </View>

          {/* LinkedIn Prompt after first question */}
          {index === 0 && (
            <View style={styles.promptCard}>
              <TouchableOpacity style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <View style={styles.promptContent}>
                <View style={styles.promptIcon}>
                  <Text style={styles.linkedinIcon}>in</Text>
                </View>
                <View style={styles.promptTextContainer}>
                  <Text style={styles.promptTitle}>Connect LinkedIn</Text>
                  <Text style={styles.promptSubtitle}>
                    Find people similar to your professional network
                  </Text>
                </View>
                <TouchableOpacity style={styles.connectButton}>
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Community Prompt after second question */}
          {index === 1 && (
            <View style={styles.promptCard}>
              <TouchableOpacity style={styles.closeButton}>
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
                <TouchableOpacity style={styles.askButton}>
                  <Text style={styles.askButtonText}>Ask</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  questionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    lineHeight: 26,
    paddingRight: 80,
  },
  timestamp: {
    position: 'absolute',
    top: 24,
    right: 20,
    fontSize: 14,
    color: '#999999',
  },
  answerText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  heartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartIcon: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  heartCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
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
    top: 12,
    right: 12,
    zIndex: 1,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
    fontWeight: '300',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promptIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#0A66C2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkedinIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkIcon: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  promptTextContainer: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  promptSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  connectButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  askButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  bottomPadding: {
    height: 100,
  },
});