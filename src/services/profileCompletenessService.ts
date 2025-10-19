import { User } from '../types';

export interface MissingField {
  field: string;
  displayName: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface ProfileCompletenessResult {
  percentage: number;
  isComplete: boolean;
  missingFields: MissingField[];
  completedFields: string[];
}

class ProfileCompletenessService {
  /**
   * Define mandatory fields for dating profile
   * Critical fields must be filled for profile to be considered complete
   */
  private mandatoryFields: Record<string, {
    displayName: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    weight: number; // How much this field contributes to completion %
  }> = {
    name: {
      displayName: 'Name',
      importance: 'critical',
      description: 'Your first name',
      weight: 10,
    },
    dateOfBirth: {
      displayName: 'Date of Birth',
      importance: 'critical',
      description: 'Required for age verification (18+)',
      weight: 10,
    },
    gender: {
      displayName: 'Gender',
      importance: 'critical',
      description: 'How you identify',
      weight: 10,
    },
    bio: {
      displayName: 'Bio',
      importance: 'critical',
      description: 'Tell others about yourself (min 50 characters)',
      weight: 15,
    },
    photos: {
      displayName: 'Photos',
      importance: 'critical',
      description: 'At least 2 clear photos of yourself',
      weight: 20,
    },
    location: {
      displayName: 'Location',
      importance: 'high',
      description: 'City/region for finding nearby matches',
      weight: 10,
    },
    lookingFor: {
      displayName: 'Looking For',
      importance: 'high',
      description: 'Gender preferences for matching',
      weight: 10,
    },
    relationshipGoals: {
      displayName: 'Relationship Goals',
      importance: 'high',
      description: 'What kind of relationship you\'re seeking',
      weight: 5,
    },
    interests: {
      displayName: 'Interests',
      importance: 'medium',
      description: 'Your hobbies and interests (min 3)',
      weight: 5,
    },
    emailVerified: {
      displayName: 'Email Verified',
      importance: 'medium',
      description: 'Confirm your email address',
      weight: 5,
    },
  };

  /**
   * Calculate profile completeness based on filled fields
   */
  calculateCompleteness(user: User): ProfileCompletenessResult {
    const missingFields: MissingField[] = [];
    const completedFields: string[] = [];
    let totalWeight = 0;
    let completedWeight = 0;

    // Calculate total possible weight
    Object.values(this.mandatoryFields).forEach(field => {
      totalWeight += field.weight;
    });

    // Check each mandatory field
    Object.entries(this.mandatoryFields).forEach(([fieldKey, fieldConfig]) => {
      const isFieldComplete = this.isFieldComplete(user, fieldKey);

      if (isFieldComplete) {
        completedFields.push(fieldKey);
        completedWeight += fieldConfig.weight;
      } else {
        missingFields.push({
          field: fieldKey,
          displayName: fieldConfig.displayName,
          importance: fieldConfig.importance,
          description: fieldConfig.description,
        });
      }
    });

    // Calculate percentage (0-100)
    const percentage = Math.round((completedWeight / totalWeight) * 100);

    // Profile is complete if all CRITICAL fields are filled
    const criticalFieldsMissing = missingFields.filter(f => f.importance === 'critical');
    const isComplete = criticalFieldsMissing.length === 0;

    return {
      percentage,
      isComplete,
      missingFields: missingFields.sort((a, b) => {
        // Sort by importance
        const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      }),
      completedFields,
    };
  }

  /**
   * Check if a specific field is complete
   */
  private isFieldComplete(user: User, fieldKey: string): boolean {
    switch (fieldKey) {
      case 'name':
        return !!user.name && user.name.trim().length > 0;

      case 'dateOfBirth':
        if (!user.dateOfBirth) return false;
        // Verify age is 18+ (basic check)
        const birthDate = new Date(user.dateOfBirth);
        const age = this.calculateAge(birthDate);
        return age >= 18;

      case 'gender':
        return !!user.gender;

      case 'bio':
        // Bio must be at least 50 characters
        return !!user.bio && user.bio.trim().length >= 50;

      case 'photos':
        // At least 2 photos required
        return !!user.photos && user.photos.length >= 2;

      case 'location':
        // At least city is required
        return !!user.location && !!user.location.city;

      case 'lookingFor':
        // At least one preference selected
        return !!user.lookingFor && user.lookingFor.length > 0;

      case 'relationshipGoals':
        return !!user.relationshipGoals;

      case 'interests':
        // At least 3 interests
        return !!user.interests && user.interests.length >= 3;

      case 'emailVerified':
        return !!user.emailVerified;

      default:
        return false;
    }
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get age from user profile
   */
  getUserAge(user: User): number | null {
    if (!user.dateOfBirth) return null;
    return this.calculateAge(new Date(user.dateOfBirth));
  }

  /**
   * Get next recommended field to complete
   */
  getNextFieldToComplete(user: User): MissingField | null {
    const result = this.calculateCompleteness(user);

    // Return the most important missing field
    return result.missingFields[0] || null;
  }

  /**
   * Check if user meets minimum requirements for matching
   */
  canMatch(user: User): boolean {
    const result = this.calculateCompleteness(user);

    // User can match if all critical fields are completed
    return result.isComplete;
  }

  /**
   * Get user-friendly completion message
   */
  getCompletionMessage(percentage: number): string {
    if (percentage === 100) {
      return 'Your profile is complete! 🎉';
    } else if (percentage >= 80) {
      return 'Almost there! Just a few more details...';
    } else if (percentage >= 50) {
      return 'You\'re halfway there! Keep going...';
    } else if (percentage >= 25) {
      return 'Good start! Complete your profile to unlock matching.';
    } else {
      return 'Let\'s build your profile! Fill in your details to get started.';
    }
  }
}

export const profileCompletenessService = new ProfileCompletenessService();
