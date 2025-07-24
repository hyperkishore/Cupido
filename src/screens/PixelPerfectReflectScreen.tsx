import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export const PixelPerfectReflectScreen = () => {
  const [answer, setAnswer] = useState('');

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.questionInfo}>
          <Text style={styles.questionNumber}>Question 1</Text>
          <Text style={styles.category}>Relationships</Text>
        </View>
        
        <TouchableOpacity>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Daily Reflection</Text>
        <Text style={styles.question}>
          How have your relationships evolved recently?
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts..."
            placeholderTextColor="#C7C7CC"
            multiline
            value={answer}
            onChangeText={setAnswer}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.editIcon}>
            <Text style={styles.editIconText}>✏️</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.charCount}>{answer.length}/500</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Complete Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            answer.trim().length === 0 && styles.nextButtonDisabled
          ]}
          disabled={answer.trim().length === 0}
        >
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000000',
  },
  questionInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  category: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  skipButton: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },
  question: {
    fontSize: 22,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 28,
    marginBottom: 40,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    minHeight: 200,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 50,
  },
  textInput: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 22,
    minHeight: 168,
    textAlignVertical: 'top',
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  editIconText: {
    fontSize: 18,
  },
  charCount: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
  },
  completeButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#FFCCCB',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});