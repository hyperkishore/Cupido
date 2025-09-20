import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
  Vibration,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { questionsService, CategoryQuestion } from '../services/questionsLoader';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { habitTrackingService } from '../services/habitTrackingService';
import { personalityInsightsService } from '../services/personalityInsightsService';
import { conversationMemoryService } from '../services/conversationMemoryService';
import { intelligentQuestionService, QuestionWithContext } from '../services/intelligentQuestionService';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  questionId?: string;
  imageUri?: string;
  imageInsights?: string;
}

interface ConversationState {
  questionsAsked: string[];
  currentTopic?: string;
  followUpCount: number;
  personalityInsights: {
    traits: string[];
    interests: string[];
    values: string[];
  };
}

export const ChatReflectionInterface = () => {
  const { dispatch } = useAppState();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionWithContext | null>(null);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    questionsAsked: [],
    currentTopic: undefined,
    followUpCount: 0,
    personalityInsights: {
      traits: [],
      interests: [],
      values: []
    }
  });
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [wasVoiceUsed, setWasVoiceUsed] = useState(false);
  const recordingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load questions and start conversation
    loadQuestionsAndStart();
    setupAudioMode();
  }, []);

  const loadQuestionsAndStart = async () => {
    try {
      // Initialize services
      await conversationMemoryService.initialize();
      await intelligentQuestionService.initialize();
      
      // Load all questions from the JSON file for backwards compatibility
      const questionsData = await import('../data/questions.json');
      setAllQuestions(questionsData.default || questionsData);
      
      startConversation();
    } catch (error) {
      console.error('Error loading questions and services:', error);
      // Fallback to basic conversation
      startConversation();
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const setupAudioMode = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      // Stop any existing recording first
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant audio recording permission to use voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      }

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) {
      console.log('No recording to stop');
      return;
    }

    try {
      console.log('Stopping recording...');
      
      // Stop animation immediately
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(0);
      
      // Update state immediately
      setIsRecording(false);

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at:', uri);

      // Clear recording reference
      setRecording(null);

      // Transcribe the audio
      if (uri) {
        const transcribedText = await transcribeAudio(uri);
        if (transcribedText && transcribedText.trim()) {
          setCurrentInput(transcribedText);
          setWasVoiceUsed(true);
        }
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const transcribeAudio = async (uri: string): Promise<string> => {
    try {
      console.log('Transcribing audio from:', uri);
      
      // Check if OpenAI API key is available
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.log('OpenAI API key not configured, using placeholder transcription');
        return 'This is a placeholder transcription. Configure OpenAI API key for real transcription.';
      }
      
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      } as any);
      formData.append('model', 'whisper-1');

      // Use OpenAI Whisper API for transcription
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Transcription result:', result);
        return result.text || '';
      } else {
        const errorText = await response.text();
        console.error('Transcription failed:', response.status, response.statusText, errorText);
        return 'Voice transcription failed. Please type your response.';
      }
    } catch (error) {
      console.error('Transcription error:', error);
      return 'Voice transcription error. Please type your response.';
    }
  };

  const startConversation = () => {
    const greetings = [
      "Hey! I'm genuinely excited to get to know you better. I love having deep conversations with people – there's something magical about really understanding what makes someone tick.",
      "Hi there! I'm that friend who asks the questions everyone else is thinking but doesn't dare to ask. Ready to dive into what makes you... well, you?",
      "Hello! Think of me as your most curious friend – the one who remembers what you said three conversations ago and actually wants to understand your perspective on life.",
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    const greetingMessage: ChatMessage = {
      id: generateId(),
      text: greeting,
      isBot: true,
      timestamp: new Date(),
    };
    
    setMessages([greetingMessage]);
    
    // After a short delay, start with a natural conversation opener
    setTimeout(() => {
      askNaturalQuestion();
    }, 2500);
  };

  const askNaturalQuestion = async () => {
    try {
      // Use intelligent question service with memory
      const questionWithContext = await intelligentQuestionService.getQuestionWithMemoryContext('');
      
      if (!questionWithContext) {
        console.error('No question available from intelligent service');
        return;
      }
      
      const { question, memoryReference, conversationLeadIn } = questionWithContext;
      setCurrentQuestion(question);
      
      // Build the complete message with memory reference if available
      let messageText = '';
      
      if (memoryReference) {
        messageText = `${memoryReference} ${conversationLeadIn} ${question.question}`;
      } else {
        messageText = `${conversationLeadIn} ${question.question}`;
      }
      
      const questionMessage: ChatMessage = {
        id: generateId(),
        text: messageText,
        isBot: true,
        timestamp: new Date(),
        questionId: question.id,
      };
      
      setMessages(prev => [...prev, questionMessage]);
      setIsWaitingForAnswer(true);
      
      // Track this question in local state for backwards compatibility
      setConversationState(prev => ({
        ...prev,
        questionsAsked: [...prev.questionsAsked, question.question],
        currentTopic: question.theme
      }));
      
    } catch (error) {
      console.error('Error getting intelligent question:', error);
      // Fallback to old method
      fallbackToLegacyQuestion();
    }
  };

  const fallbackToLegacyQuestion = () => {
    const question = selectNextQuestion();
    if (!question) return;
    
    setCurrentQuestion({
      id: question.id || generateId(),
      question: question.question,
      theme: question.theme || 'Self-Discovery',
      tone: question.tone || 'curious',
      emotional_depth: question.emotional_depth || 'medium',
      intended_use_case: question.intended_use_case || 'reflection',
      contextScore: 50,
      selectionReason: 'Fallback question selection'
    });
    
    const conversationLeadIns = getConversationLeadIn(question);
    
    const questionMessage: ChatMessage = {
      id: generateId(),
      text: `${conversationLeadIns} ${question.question}`,
      isBot: true,
      timestamp: new Date(),
      questionId: question.id || generateId(),
    };
    
    setMessages(prev => [...prev, questionMessage]);
    setIsWaitingForAnswer(true);
  };

  const selectNextQuestion = () => {
    let availableQuestions = [];
    
    if (allQuestions.length > 0) {
      // Use questions from JSON file
      availableQuestions = allQuestions.filter(q => 
        !conversationState.questionsAsked.includes(q.question)
      );
    } else {
      // Fallback to service questions
      const serviceQuestion = questionsService.getDailyReflectionQuestion();
      return serviceQuestion;
    }
    
    if (availableQuestions.length === 0) {
      // If we've asked all questions, reset and start over with different themes
      availableQuestions = allQuestions;
      setConversationState(prev => ({ ...prev, questionsAsked: [] }));
    }
    
    // Intelligently select based on conversation flow
    return selectQuestionBasedOnContext(availableQuestions);
  };

  const selectQuestionBasedOnContext = (questions: any[]) => {
    const messageCount = messages.filter(m => !m.isBot).length;
    
    // Start with lighter questions, progress to deeper ones
    if (messageCount === 0) {
      // First question - something engaging but not too heavy
      const starters = questions.filter(q => 
        q.emotional_depth === 'low' || q.emotional_depth === 'medium'
      );
      return starters[Math.floor(Math.random() * starters.length)];
    } else if (messageCount < 3) {
      // Early questions - mixed depth
      const early = questions.filter(q => q.emotional_depth !== 'high');
      return early[Math.floor(Math.random() * early.length)];
    } else {
      // Later questions - can go deeper
      return questions[Math.floor(Math.random() * questions.length)];
    }
  };

  const getConversationLeadIn = (question: any) => {
    const messageCount = messages.filter(m => !m.isBot).length;
    const tone = question.tone;
    
    if (messageCount === 0) {
      const firstQuestionLeadIns = [
        "Let me start with something I'm genuinely curious about:",
        "Here's what I'm wondering about you:",
        "I'd love to know:"
      ];
      return firstQuestionLeadIns[Math.floor(Math.random() * firstQuestionLeadIns.length)];
    }
    
    // Topic transitions based on previous responses
    if (conversationState.currentTopic !== question.theme) {
      const transitions = [
        "Speaking of that, this makes me think of something else:",
        "That's fascinating. On a slightly different note:",
        "You know what else I'm curious about?",
        "That reminds me of something I wanted to ask:"
      ];
      return transitions[Math.floor(Math.random() * transitions.length)];
    }
    
    // Continuing same topic
    const continuations = [
      "Building on that:",
      "That's interesting! Related to that:",
      "I'm curious to explore this further:",
      "That makes me wonder:"
    ];
    return continuations[Math.floor(Math.random() * continuations.length)];
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !currentQuestion) return;

    const answerText = currentInput.trim();
    
    // Add user's message
    const userMessage: ChatMessage = {
      id: generateId(),
      text: answerText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Save the reflection
    try {
      const newAnswer = {
        id: generateId(),
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        text: answerText,
        category: currentQuestion.theme || 'Self-Discovery',
        timestamp: new Date().toISOString(),
        hearts: 0,
        isLiked: false,
      };

      dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
      
      // Save to conversation memory service
      await conversationMemoryService.addConversation(
        currentQuestion.id,
        currentQuestion.question,
        answerText,
        currentQuestion.theme || 'Self-Discovery',
        currentQuestion.theme,
        wasVoiceUsed
      );
      
      await habitTrackingService.addReflection(
        currentQuestion.question,
        answerText,
        wasVoiceUsed
      );

      // Analyze reflection for personality insights
      await personalityInsightsService.analyzeReflection(
        currentQuestion.question,
        answerText,
        currentQuestion.theme || 'Self-Discovery',
        wasVoiceUsed
      );

      // Bot response after user answers
      setTimeout(() => {
        provideFeedbackAndContinue(answerText);
      }, 1000);

      // Check for achievements
      setTimeout(() => {
        checkForAchievements(answerText);
      }, 2500);

    } catch (error) {
      console.error('Error saving reflection:', error);
    }

    setCurrentInput('');
    setWasVoiceUsed(false);
    setIsWaitingForAnswer(false);
  };

  const provideFeedbackAndContinue = (answerText: string) => {
    // Analyze the user's response for contextual, friend-like feedback
    const userResponse = answerText.toLowerCase();
    const responseLength = userResponse.split(' ').length;
    
    // Update personality insights based on response
    updatePersonalityInsights(answerText);
    
    let response = generateAuthenticResponse(answerText, userResponse, responseLength);
    
    const feedbackMessage: ChatMessage = {
      id: generateId(),
      text: response,
      isBot: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, feedbackMessage]);

    // Continue conversation naturally after a pause
    setTimeout(() => {
      continueConversationNaturally(answerText);
    }, 2000 + Math.random() * 1000); // Variable delay for natural feel
  };

  const updatePersonalityInsights = (answer: string) => {
    const words = answer.toLowerCase();
    let newTraits: string[] = [];
    let newInterests: string[] = [];
    let newValues: string[] = [];
    
    // Extract traits
    if (words.includes('creative') || words.includes('art') || words.includes('music')) {
      newTraits.push('creative');
    }
    if (words.includes('family') || words.includes('friends') || words.includes('relationship')) {
      newTraits.push('relationship-oriented');
    }
    if (words.includes('adventure') || words.includes('travel') || words.includes('explore')) {
      newTraits.push('adventurous');
    }
    
    // Extract interests
    if (words.includes('reading') || words.includes('books')) newInterests.push('reading');
    if (words.includes('nature') || words.includes('outdoors')) newInterests.push('nature');
    if (words.includes('cooking') || words.includes('food')) newInterests.push('culinary');
    
    // Extract values
    if (words.includes('honest') || words.includes('authentic')) newValues.push('authenticity');
    if (words.includes('kind') || words.includes('compassion')) newValues.push('kindness');
    if (words.includes('growth') || words.includes('learn')) newValues.push('growth');
    
    setConversationState(prev => ({
      ...prev,
      personalityInsights: {
        traits: [...new Set([...prev.personalityInsights.traits, ...newTraits])],
        interests: [...new Set([...prev.personalityInsights.interests, ...newInterests])],
        values: [...new Set([...prev.personalityInsights.values, ...newValues])]
      }
    }));
  };

  const generateAuthenticResponse = (answerText: string, userResponse: string, responseLength: number) => {
    // Context-aware responses that feel like a real friend
    if (userResponse.includes('difficult') || userResponse.includes('hard') || userResponse.includes('struggle')) {
      const vulnerableResponses = [
        "Honestly, thank you for trusting me with that. It's not easy to share the hard stuff.",
        "I really respect your openness here. That kind of vulnerability takes courage.",
        "That sounds really challenging. I'm glad you felt comfortable sharing that with me."
      ];
      return vulnerableResponses[Math.floor(Math.random() * vulnerableResponses.length)];
    }
    
    if (userResponse.includes('happy') || userResponse.includes('joy') || userResponse.includes('love') || userResponse.includes('excited')) {
      const joyfulResponses = [
        "I love how your face probably lights up when you talk about this! That joy is infectious.",
        "There's something beautiful about hearing someone talk about what truly makes them happy.",
        "Your enthusiasm about this is so genuine – it's one of those things that makes you uniquely you."
      ];
      return joyfulResponses[Math.floor(Math.random() * joyfulResponses.length)];
    }
    
    if (responseLength > 50) {
      const deepResponses = [
        "Wow, I can tell you've really thought about this. The way you articulate your thoughts is fascinating.",
        "I love how deeply you think about things. There are layers to your perspective that are really intriguing.",
        "You have such a thoughtful way of seeing things. I find myself thinking about what you just shared."
      ];
      return deepResponses[Math.floor(Math.random() * deepResponses.length)];
    }
    
    if (responseLength < 8) {
      const conciseResponses = [
        "Sometimes the best truths are simple ones. There's power in that clarity.",
        "I appreciate the honesty in that. Not everything needs a long explanation.",
        "That's beautifully direct. I respect people who can distill things to their essence."
      ];
      return conciseResponses[Math.floor(Math.random() * conciseResponses.length)];
    }
    
    // Default authentic responses
    const authenticResponses = [
      "That's really interesting. I can see why that resonates with you.",
      "There's something authentic about the way you express yourself that I really appreciate.",
      "I love getting these glimpses into how your mind works.",
      "That perspective is so uniquely yours. It's fascinating to hear."
    ];
    return authenticResponses[Math.floor(Math.random() * authenticResponses.length)];
  };

  const continueConversationNaturally = (previousAnswer: string) => {
    const shouldFollowUp = Math.random() < 0.3; // 30% chance of follow-up
    const shouldAskNew = Math.random() < 0.7; // 70% chance of new question
    
    if (shouldFollowUp && conversationState.followUpCount < 2) {
      // Ask a contextual follow-up
      askContextualFollowUp(previousAnswer);
      setConversationState(prev => ({ ...prev, followUpCount: prev.followUpCount + 1 }));
    } else if (shouldAskNew) {
      // Ask a new question with natural transition
      setTimeout(() => {
        askNaturalQuestion();
      }, 1000);
      setConversationState(prev => ({ ...prev, followUpCount: 0 }));
    } else {
      // Share a personal insight or observation
      sharePersonalInsight();
    }
  };

  const askContextualFollowUp = (previousAnswer: string) => {
    const answer = previousAnswer.toLowerCase();
    let followUp = "";
    
    if (answer.includes('family') || answer.includes('parent') || answer.includes('sibling')) {
      const familyFollowUps = [
        "Family dynamics are so complex, aren't they? How do you think your family has shaped your perspective on relationships?",
        "It's interesting how family experiences stay with us. What's one thing you appreciate about your family dynamic that you didn't recognize when you were younger?"
      ];
      followUp = familyFollowUps[Math.floor(Math.random() * familyFollowUps.length)];
    } else if (answer.includes('work') || answer.includes('career') || answer.includes('job')) {
      const workFollowUps = [
        "Work is such a big part of our identity. Do you feel like your work reflects who you are, or is it more separate from your 'real' self?",
        "That's fascinating about your work life. What's something about your career path that would surprise people who know you now?"
      ];
      followUp = workFollowUps[Math.floor(Math.random() * workFollowUps.length)];
    } else if (answer.includes('friend') || answer.includes('relationship')) {
      const relationshipFollowUps = [
        "Relationships are everything, really. What's something you've learned about yourself through your friendships?",
        "It's beautiful how much our connections shape us. How do you think you show up differently in various relationships?"
      ];
      followUp = relationshipFollowUps[Math.floor(Math.random() * relationshipFollowUps.length)];
    } else {
      // Generic but thoughtful follow-ups
      const genericFollowUps = [
        "That makes me curious – what's the story behind how you developed that perspective?",
        "I'm intrigued by that. What do you think someone close to you would say about that aspect of who you are?",
        "That's really insightful. How do you think that shows up in your daily life?"
      ];
      followUp = genericFollowUps[Math.floor(Math.random() * genericFollowUps.length)];
    }
    
    const followUpMessage: ChatMessage = {
      id: generateId(),
      text: followUp,
      isBot: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, followUpMessage]);
    setIsWaitingForAnswer(true);
  };

  const sharePersonalInsight = () => {
    const insights = [
      "You know, talking with you makes me think about how we all have these hidden depths that only come out in the right conversations.",
      "I love these kinds of conversations where you start to see the real person behind the everyday interactions.",
      "There's something special about the way you think about things. It's like you see the world through your own unique lens.",
      "I find it fascinating how much you can learn about someone just by paying attention to how they express themselves."
    ];
    
    const insight = insights[Math.floor(Math.random() * insights.length)];
    
    const insightMessage: ChatMessage = {
      id: generateId(),
      text: insight,
      isBot: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, insightMessage]);
    
    // Continue with a new question after sharing insight
    setTimeout(() => {
      askNaturalQuestion();
    }, 2500);
  };

  const handleSharePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to share them.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const userMessage: ChatMessage = {
          id: generateId(),
          text: "Here's a photo from my day",
          isBot: false,
          timestamp: new Date(),
          imageUri: result.assets[0].uri,
        };

        setMessages(prev => [...prev, userMessage]);

        // Analyze the photo and provide insights
        setTimeout(() => {
          analyzePhoto(result.assets[0].uri);
        }, 1000);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzePhoto = (imageUri: string) => {
    // Simulate AI analysis of the photo for personality insights
    const photoInsights = [
      "I can see this moment captures something meaningful to you. What drew you to this particular scene or moment?",
      "There's something beautiful about everyday moments like this. How does sharing this photo make you feel?",
      "Photos often tell stories beyond what we see. What story does this image tell about your day?",
      "I notice you chose to capture this moment. What made it special enough to preserve?",
      "This photo gives me insight into what you value. Can you tell me more about why this moment mattered?",
    ];

    const insight = photoInsights[Math.floor(Math.random() * photoInsights.length)];

    const botResponse: ChatMessage = {
      id: generateId(),
      text: insight,
      isBot: true,
      timestamp: new Date(),
      imageInsights: "Photo analyzed for personality insights",
    };

    setMessages(prev => [...prev, botResponse]);
    setIsWaitingForAnswer(true);
  };

  const checkForAchievements = async (answerText: string) => {
    const messageCount = messages.filter(m => !m.isBot).length;
    const wordCount = answerText.split(' ').length;
    
    let achievementMessage = null;

    // First reflection achievement
    if (messageCount === 1) {
      achievementMessage = "🎉 Achievement Unlocked: First Steps! \n\nYou've taken your first step on this journey of self-discovery. Welcome to the community!";
    }
    // Deep thinker achievement
    else if (wordCount > 40 && messageCount === 3) {
      achievementMessage = "🧠 Achievement Unlocked: Deep Thinker! \n\nYour thoughtful reflections show real introspection. You're building an authentic profile!";
    }
    // Vulnerability achievement
    else if ((answerText.toLowerCase().includes('difficult') || answerText.toLowerCase().includes('struggle') || answerText.toLowerCase().includes('vulnerable')) && messageCount >= 2) {
      achievementMessage = "💙 Achievement Unlocked: Vulnerability Warrior! \n\nSharing something personal takes courage. Your authenticity is inspiring!";
    }
    // Consistency achievement
    else if (messageCount === 5) {
      achievementMessage = "⭐ Achievement Unlocked: Reflection Master! \n\nFive thoughtful responses! You're 25% of the way to unlocking 1-on-1 chats!";
    }

    if (achievementMessage) {
      setTimeout(() => {
        const achievement: ChatMessage = {
          id: generateId(),
          text: achievementMessage,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, achievement]);
      }, 1000);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          message.isBot ? styles.botBubble : styles.userBubble
        ]}>
          {message.imageUri && (
            <Image 
              source={{ uri: message.imageUri }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          <Text style={[
            styles.messageText,
            message.isBot ? styles.botText : styles.userText,
            message.imageUri && styles.messageTextWithImage
          ]}>
            {message.text}
          </Text>
        </View>
        <Text style={[
          styles.timestamp,
          message.isBot ? styles.botTimestamp : styles.userTimestamp
        ]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: Platform.OS === 'ios' ? 90 : 70 }]}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Input area - only shows when waiting for answer */}
      {isWaitingForAnswer && (
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={handleSharePhoto}
            >
              <Text style={styles.attachButtonIcon}>📎</Text>
            </TouchableOpacity>
            
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, isRecording && styles.textInputRecording]}
                value={currentInput}
                onChangeText={setCurrentInput}
                placeholder={isRecording ? "Recording..." : "Type your thoughts or hold to record"}
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={500}
                autoFocus={isWaitingForAnswer && !isRecording}
                editable={!isRecording}
              />
              
              {/* Voice recording button - WhatsApp style */}
              <Pressable 
                style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
              >
                <Animated.View style={[
                  styles.voiceButtonContent, 
                  isRecording && styles.voiceButtonContentRecording,
                  {
                    transform: [{
                      scale: recordingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    }],
                  }
                ]}>
                  <Text style={[styles.voiceButtonIcon, isRecording && styles.voiceButtonIconRecording]}>🎤</Text>
                </Animated.View>
              </Pressable>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                currentInput.trim().length === 0 && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={currentInput.trim().length === 0 || isRecording}
            >
              <Text style={[
                styles.sendButtonText,
                currentInput.trim().length === 0 && styles.sendButtonTextDisabled
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    flexGrow: 1,
    paddingTop: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#000000',
  },
  userText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  botTimestamp: {
    textAlign: 'left',
  },
  userTimestamp: {
    textAlign: 'right',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 70,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sendButtonTextDisabled: {
    color: '#8E8E93',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageTextWithImage: {
    marginTop: 0,
  },
  attachButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  attachButtonIcon: {
    fontSize: 18,
    color: '#8E8E93',
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    minHeight: 22,
    paddingRight: 40,
    paddingVertical: 8,
    lineHeight: 20,
  },
  textInputRecording: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  voiceButton: {
    position: 'absolute',
    right: 4,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  voiceButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  voiceButtonContentRecording: {
    backgroundColor: 'transparent',
  },
  voiceButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  voiceButtonIconRecording: {
    color: '#FFFFFF',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});