import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { supabaseService, User } from '../services/supabase.production';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MatchingScreenProps {
  currentUser: User;
}

export const MatchingScreen: React.FC<MatchingScreenProps> = ({ currentUser }) => {
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const loadPotentialMatches = async () => {
    try {
      setLoading(true);
      const matches = await supabaseService.getPotentialMatches(currentUser.id, 20);
      setPotentialMatches(matches);
      setCurrentIndex(0);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load potential matches');
      console.error('Load matches error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentMatch = potentialMatches[currentIndex];
    if (!currentMatch) return;

    const toValue = direction === 'right' ? screenWidth + 100 : -screenWidth - 100;
    const rotateToValue = direction === 'right' ? 1 : -1;

    // Animate card exit
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: rotateToValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // Handle the match/pass logic
      if (direction === 'right') {
        try {
          const match = await supabaseService.createMatch(currentUser.id, currentMatch.id);
          console.log('Match created:', match);
          
          // Check if it's a mutual match
          const updatedMatch = await supabaseService.respondToMatch(match.id, currentUser.id, true);
          if (updatedMatch.status === 'matched') {
            Alert.alert(
              'It\'s a Match! 💕',
              `You and ${currentMatch.first_name} liked each other!`,
              [{ text: 'Start Chatting', onPress: () => console.log('Navigate to chat') }]
            );
          }
        } catch (error: any) {
          console.error('Match creation error:', error);
        }
      }

      // Move to next card
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        // Reset card position for next card
        translateX.setValue(0);
        translateY.setValue(0);
        rotate.setValue(0);
        opacity.setValue(1);
        
        // Load more matches if running low
        if (nextIndex >= potentialMatches.length - 3) {
          loadPotentialMatches();
        }
        
        return nextIndex;
      });
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    
    onPanResponderMove: (event, gestureState) => {
      translateX.setValue(gestureState.dx);
      translateY.setValue(gestureState.dy);
    },
    
    onPanResponderRelease: (event, gestureState) => {
      const { dx, vx } = gestureState;
      
      // Determine swipe direction based on position and velocity
      if (Math.abs(dx) > screenWidth * 0.25 || Math.abs(vx) > 0.8) {
        const direction = dx > 0 ? 'right' : 'left';
        handleSwipe(direction);
      } else {
        resetCardPosition();
      }
    },
  });

  // Update rotation based on translateX
  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      const rotateValue = value / screenWidth * 0.4;
      rotate.setValue(rotateValue);
    });

    return () => translateX.removeListener(listenerId);
  }, []);

  const currentMatch = potentialMatches[currentIndex];

  if (loading && potentialMatches.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Finding compatible matches...</Text>
      </View>
    );
  }

  if (!currentMatch) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No More Matches</Text>
          <Text style={styles.emptySubtitle}>
            Come back later for more potential connections
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadPotentialMatches}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cardTransform = {
    transform: [
      { translateX },
      { translateY },
      { rotate: rotate.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-30deg', '0deg', '30deg'],
        })
      },
    ],
    opacity,
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <View style={styles.container}>
      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {/* Next card (behind) */}
        {potentialMatches[currentIndex + 1] && (
          <View style={[styles.card, styles.cardBehind]}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>
                {potentialMatches[currentIndex + 1].first_name}
              </Text>
            </View>
          </View>
        )}

        {/* Current card */}
        <Animated.View 
          style={[styles.card, cardTransform]}
          {...panResponder.panHandlers}
        >
          <View style={styles.cardContent}>
              {/* Profile Photo Placeholder */}
              <View style={styles.photoContainer}>
                <Text style={styles.photoPlaceholder}>📸</Text>
                <Text style={styles.photoText}>Photo</Text>
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.nameAgeContainer}>
                  <Text style={styles.name}>
                    {currentMatch.first_name} {currentMatch.last_name || ''}
                  </Text>
                  <Text style={styles.age}>
                    {calculateAge(currentMatch.date_of_birth)}
                  </Text>
                </View>

                {currentMatch.location_city && (
                  <Text style={styles.location}>
                    📍 {currentMatch.location_city}
                  </Text>
                )}

                {currentMatch.bio && (
                  <ScrollView style={styles.bioContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.bio}>
                      {currentMatch.bio}
                    </Text>
                  </ScrollView>
                )}

                {/* Interests Tags */}
                {currentMatch.interests_tags && currentMatch.interests_tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {currentMatch.interests_tags.slice(0, 6).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe('left')}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}
        >
          <Text style={styles.actionIcon}>♥</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe Hints */}
      <View style={styles.hintsContainer}>
        <Text style={styles.hintText}>
          Swipe right to like • Swipe left to pass
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 18,
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
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: screenWidth - 40,
    height: screenHeight * 0.65,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    position: 'absolute',
  },
  cardBehind: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  photoContainer: {
    flex: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPlaceholder: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  profileInfo: {
    flex: 1,
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginRight: 12,
  },
  age: {
    fontSize: 24,
    fontWeight: '400',
    color: '#8E8E93',
  },
  location: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
  },
  bioContainer: {
    maxHeight: 80,
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    gap: 40,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  passButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF4458',
  },
  likeButton: {
    backgroundColor: '#4FC3F7',
  },
  actionIcon: {
    fontSize: 28,
    fontWeight: '700',
  },
  hintsContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});