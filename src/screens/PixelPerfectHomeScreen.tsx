import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export const PixelPerfectHomeScreen = () => {
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(true);
  const [showCommunityPrompt, setShowCommunityPrompt] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Question 1 */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            What made you smile today, and why did it resonate with you?
          </Text>
          <Text style={styles.timestamp}>2h ago</Text>
        </View>
        
        <Text style={styles.answerText}>
          A stranger helped an elderly person with groceries. It reminded me that small acts of kindness create ripples of goodness in the world.
        </Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>PERSONAL GROWTH</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.heartCount}>12</Text>
          </View>
        </View>
      </View>

      {/* LinkedIn Connect Prompt */}
      {showLinkedInPrompt && (
        <View style={styles.promptCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowLinkedInPrompt(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <View style={styles.promptContent}>
            <View style={styles.linkedinIconContainer}>
              <Text style={styles.linkedinIcon}>🔒</Text>
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

      {/* Question 2 */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            What does intimacy mean to you beyond physical connection?
          </Text>
          <Text style={styles.timestamp}>4h ago</Text>
        </View>
        
        <Text style={styles.answerText}>
          Being able to share my weird thoughts at 3am and having someone not just listen, but add their own weird thoughts to the mix.
        </Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>RELATIONSHIPS</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.heartCount}>8</Text>
          </View>
        </View>
      </View>

      {/* Question 3 */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            What's a belief you held strongly that has evolved over time?
          </Text>
          <Text style={styles.timestamp}>6h ago</Text>
        </View>
        
        <Text style={styles.answerText}>
          I used to think vulnerability was weakness. Now I see it as the bravest thing you can do - it's how we truly connect with others.
        </Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>VALUES</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.heartCount}>15</Text>
          </View>
        </View>
      </View>

      {/* Question 4 */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            What's something you're curious about that others might find unusual?
          </Text>
          <Text style={styles.timestamp}>12h ago</Text>
        </View>
        
        <Text style={styles.answerText}>
          Why do we say 'after dark' when it's actually 'during dark'? Language fascinates me in the weirdest ways.
        </Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>DREAMS</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.heartCount}>3</Text>
          </View>
        </View>
      </View>

      {/* Question 5 */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            How do you show care for someone you love?
          </Text>
          <Text style={styles.timestamp}>14h ago</Text>
        </View>
        
        <Text style={styles.answerText}>
          I remember the little things - their coffee order, the song that makes them happy, the story they told me months ago. Love is in the details.
        </Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>RELATIONSHIPS</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.heartCount}>18</Text>
          </View>
        </View>
      </View>

      {/* Community Prompt */}
      {showCommunityPrompt && (
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
            <TouchableOpacity style={styles.askButton}>
              <Text style={styles.askButtonText}>Ask</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Question 6 */}
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            What's a fear you've overcome, and how did you do it?
          </Text>
          <Text style={styles.timestamp}>16h ago</Text>
        </View>
        
        <Text style={styles.answerText}>
          Public speaking terrified me. I started by reading to my plants, then my pets, then finally joined a local poetry slam. Baby steps matter.
        </Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>PERSONAL GROWTH</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.heartCount}>14</Text>
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
  },
  heartIcon: {
    fontSize: 16,
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