/**
 * Input Validation Utilities
 * 
 * Provides comprehensive validation for all user inputs and API parameters
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
  sanitize?: boolean;
}

/**
 * Main validation function
 */
export function validate(value: any, rules: ValidationRule): ValidationResult {
  const errors: string[] = [];
  let sanitizedValue = value;

  // Handle null/undefined values
  if (value === null || value === undefined || value === '') {
    if (rules.required) {
      errors.push('This field is required');
    }
    return { isValid: errors.length === 0, errors, sanitizedValue: null };
  }

  // Type validation
  if (rules.type) {
    const typeValidation = validateType(value, rules.type);
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors);
      return { isValid: false, errors, sanitizedValue };
    }
    sanitizedValue = typeValidation.sanitizedValue ?? value;
  }

  // String-specific validations
  if (typeof sanitizedValue === 'string') {
    if (rules.minLength && sanitizedValue.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters long`);
    }
    if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters long`);
    }
    if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
      errors.push('Invalid format');
    }
    
    // Sanitize if requested
    if (rules.sanitize) {
      sanitizedValue = sanitizeInput(sanitizedValue);
    }
  }

  // Number-specific validations
  if (typeof sanitizedValue === 'number') {
    if (rules.min !== undefined && sanitizedValue < rules.min) {
      errors.push(`Must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && sanitizedValue > rules.max) {
      errors.push(`Must be no more than ${rules.max}`);
    }
  }

  // Custom validation
  if (rules.customValidator) {
    const customError = rules.customValidator(sanitizedValue);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
  };
}

/**
 * Type validation
 */
function validateType(value: any, expectedType: string): ValidationResult {
  const errors: string[] = [];
  let sanitizedValue = value;

  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        sanitizedValue = String(value);
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        errors.push('Must be a valid number');
      } else {
        sanitizedValue = num;
      }
      break;

    case 'email':
      if (typeof value !== 'string') {
        errors.push('Email must be a string');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push('Must be a valid email address');
        } else {
          sanitizedValue = value.toLowerCase().trim();
        }
      }
      break;

    case 'phone':
      if (typeof value !== 'string') {
        errors.push('Phone number must be a string');
      } else {
        // Remove all non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
          errors.push('Must be a valid phone number');
        } else {
          sanitizedValue = digitsOnly;
        }
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        errors.push('URL must be a string');
      } else {
        try {
          new URL(value);
          sanitizedValue = value.trim();
        } catch {
          errors.push('Must be a valid URL');
        }
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push('Must be a valid date');
      } else {
        sanitizedValue = date;
      }
      break;

    case 'boolean':
      if (typeof value === 'boolean') {
        sanitizedValue = value;
      } else if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
          sanitizedValue = true;
        } else if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
          sanitizedValue = false;
        } else {
          errors.push('Must be a valid boolean value');
        }
      } else {
        sanitizedValue = Boolean(value);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push('Must be an array');
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        errors.push('Must be an object');
      }
      break;

    default:
      errors.push(`Unknown type: ${expectedType}`);
  }

  return { isValid: errors.length === 0, errors, sanitizedValue };
}

/**
 * Sanitize string input
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate chat message
 */
export function validateChatMessage(message: string): ValidationResult {
  return validate(message, {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 10000,
    sanitize: true,
    customValidator: (value: string) => {
      // Check for potential spam patterns
      if (/(.)\1{20,}/.test(value)) {
        return 'Message contains too many repeated characters';
      }
      
      // Check for excessive caps
      const capsRatio = (value.match(/[A-Z]/g) || []).length / value.length;
      if (value.length > 20 && capsRatio > 0.7) {
        return 'Please avoid excessive use of capital letters';
      }
      
      return null;
    }
  });
}

/**
 * Validate user profile data
 */
export function validateUserProfile(profile: any): ValidationResult {
  const errors: string[] = [];
  const sanitizedProfile: any = {};

  // Name validation
  if (profile.name !== undefined) {
    const nameValidation = validate(profile.name, {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-'\.]+$/,
      sanitize: true,
    });
    if (!nameValidation.isValid) {
      errors.push(`Name: ${nameValidation.errors.join(', ')}`);
    } else {
      sanitizedProfile.name = nameValidation.sanitizedValue;
    }
  }

  // Email validation
  if (profile.email !== undefined) {
    const emailValidation = validate(profile.email, {
      type: 'email',
      required: false,
    });
    if (!emailValidation.isValid) {
      errors.push(`Email: ${emailValidation.errors.join(', ')}`);
    } else {
      sanitizedProfile.email = emailValidation.sanitizedValue;
    }
  }

  // Age validation
  if (profile.age !== undefined) {
    const ageValidation = validate(profile.age, {
      type: 'number',
      min: 18,
      max: 120,
    });
    if (!ageValidation.isValid) {
      errors.push(`Age: ${ageValidation.errors.join(', ')}`);
    } else {
      sanitizedProfile.age = ageValidation.sanitizedValue;
    }
  }

  // Bio validation
  if (profile.bio !== undefined) {
    const bioValidation = validate(profile.bio, {
      type: 'string',
      maxLength: 2000,
      sanitize: true,
    });
    if (!bioValidation.isValid) {
      errors.push(`Bio: ${bioValidation.errors.join(', ')}`);
    } else {
      sanitizedProfile.bio = bioValidation.sanitizedValue;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedProfile,
  };
}

/**
 * Validate API parameters
 */
export function validateApiParams(params: any, schema: Record<string, ValidationRule>): ValidationResult {
  const errors: string[] = [];
  const sanitizedParams: any = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = params[key];
    const validation = validate(value, rule);
    
    if (!validation.isValid) {
      errors.push(`${key}: ${validation.errors.join(', ')}`);
    } else if (validation.sanitizedValue !== null && validation.sanitizedValue !== undefined) {
      sanitizedParams[key] = validation.sanitizedValue;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedParams,
  };
}

/**
 * Validate image upload
 */
export function validateImageUpload(file: File): ValidationResult {
  const errors: string[] = [];

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('Image must be smaller than 10MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Image must be JPEG, PNG, WebP, or GIF format');
  }

  // Check filename
  const filenameValidation = validate(file.name, {
    type: 'string',
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\-_\.]+$/,
  });
  if (!filenameValidation.isValid) {
    errors.push('Invalid filename');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: file,
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  chatMessage: {
    message: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 10000,
      sanitize: true,
    },
    conversationId: {
      type: 'string' as const,
      pattern: /^[a-zA-Z0-9\-_]+$/,
    },
  },

  userRegistration: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      sanitize: true,
    },
    email: {
      required: true,
      type: 'email' as const,
    },
    password: {
      required: true,
      type: 'string' as const,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    age: {
      required: true,
      type: 'number' as const,
      min: 18,
      max: 120,
    },
  },

  apiSearch: {
    query: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 200,
      sanitize: true,
    },
    limit: {
      type: 'number' as const,
      min: 1,
      max: 100,
    },
    offset: {
      type: 'number' as const,
      min: 0,
    },
  },
};

/**
 * Middleware for validating request bodies
 */
export function createValidationMiddleware(schema: Record<string, ValidationRule>) {
  return (req: any, res: any, next: any) => {
    const validation = validateApiParams(req.body, schema);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }
    
    // Replace request body with sanitized values
    req.body = validation.sanitizedValue;
    next();
  };
}

export default {
  validate,
  validateChatMessage,
  validateUserProfile,
  validateApiParams,
  validateImageUpload,
  commonSchemas,
  createValidationMiddleware,
};