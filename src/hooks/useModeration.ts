import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ModerationService, ModerationResult } from '../services/moderation';

export const useModeration = () => {
  const [isChecking, setIsChecking] = useState(false);

  const moderateContent = useCallback(async (
    content: string,
    userId: string,
    contentType: 'message' | 'response' | 'profile'
  ): Promise<{ approved: boolean; cleanedContent?: string }> => {
    setIsChecking(true);
    
    try {
      const result = await ModerationService.moderateContent(content, userId, contentType);
      
      if (result.suggestedAction === 'block') {
        Alert.alert(
          'Content Blocked',
          'Your content contains inappropriate material and cannot be posted. Please revise and try again.',
          [{ text: 'OK' }]
        );
        return { approved: false };
      }
      
      if (result.suggestedAction === 'warn') {
        const suggestions = await ModerationService.getContentSuggestions(content, result.flagged);
        
        return new Promise((resolve) => {
          Alert.alert(
            'Content Warning',
            `Your content was flagged for: ${result.flagged.join(', ')}.\n\n${suggestions.join('\n\n')}\n\nWould you like to post anyway?`,
            [
              {
                text: 'Revise',
                style: 'cancel',
                onPress: () => resolve({ approved: false }),
              },
              {
                text: 'Post Anyway',
                onPress: async () => {
                  const cleanedContent = await ModerationService.cleanContent(content);
                  resolve({ approved: true, cleanedContent });
                },
              },
            ]
          );
        });
      }
      
      if (result.suggestedAction === 'review') {
        const cleanedContent = await ModerationService.cleanContent(content);
        return { approved: true, cleanedContent };
      }
      
      return { approved: true };
    } catch (error) {
      console.error('Moderation error:', error);
      // In case of error, allow content but log it
      return { approved: true };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reportUser = useCallback(async (
    reporterUserId: string,
    reportedUserId: string,
    reason: string,
    evidence?: string
  ): Promise<boolean> => {
    try {
      await ModerationService.reportUser(reporterUserId, reportedUserId, reason, evidence);
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Cupido safe. We will review your report.',
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert(
        'Error',
        'Failed to submit report. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, []);

  const checkUserRestriction = useCallback(async (userId: string): Promise<boolean> => {
    try {
      return await ModerationService.isUserRestricted(userId);
    } catch (error) {
      console.error('Restriction check error:', error);
      return false;
    }
  }, []);

  const showReportDialog = useCallback((
    reporterUserId: string,
    reportedUserId: string,
    userName: string = 'this user'
  ) => {
    Alert.alert(
      'Report User',
      `Why are you reporting ${userName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Inappropriate Content',
          onPress: () => reportUser(reporterUserId, reportedUserId, 'inappropriate_content'),
        },
        {
          text: 'Harassment',
          onPress: () => reportUser(reporterUserId, reportedUserId, 'harassment'),
        },
        {
          text: 'Spam',
          onPress: () => reportUser(reporterUserId, reportedUserId, 'spam'),
        },
        {
          text: 'Fake Profile',
          onPress: () => reportUser(reporterUserId, reportedUserId, 'fake_profile'),
        },
        {
          text: 'Other',
          onPress: () => {
            // In a real app, you'd show a text input for custom reason
            reportUser(reporterUserId, reportedUserId, 'other');
          },
        },
      ]
    );
  }, [reportUser]);

  const getModerationWarning = useCallback((result: ModerationResult): string => {
    if (result.flagged.includes('profanity')) {
      return 'Your message contains strong language. Consider using more positive words.';
    }
    if (result.flagged.includes('personal_info')) {
      return 'For your safety, avoid sharing personal information.';
    }
    if (result.flagged.includes('sexual_content')) {
      return 'Cupido focuses on emotional connections. Keep conversations appropriate.';
    }
    if (result.flagged.includes('harassment')) {
      return 'Please be kind and respectful in your interactions.';
    }
    if (result.flagged.includes('spam')) {
      return 'Keep your messages genuine and conversational.';
    }
    return 'Your content was flagged for review. Please keep interactions positive.';
  }, []);

  return {
    isChecking,
    moderateContent,
    reportUser,
    checkUserRestriction,
    showReportDialog,
    getModerationWarning,
  };
};