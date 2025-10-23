/**
 * Phone Number Normalization Utility
 * Ensures consistent phone number format across the application
 */

import { COUNTRIES, parsePhoneNumber } from './countryDetector';

/**
 * Normalize a phone number to E.164 format (digits only, with country code)
 * @param phoneNumber - The phone number to normalize
 * @returns Normalized phone number or null if invalid
 */
export function normalizePhoneNumber(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) return null;
  
  // Skip demo users and local identifiers
  if (phoneNumber.startsWith('demo_') || 
      phoneNumber.startsWith('local_')) {
    return null;
  }
  
  // If already in E.164 format with +, validate it
  if (phoneNumber.startsWith('+')) {
    const { country, localNumber } = parsePhoneNumber(phoneNumber);
    if (country && localNumber) {
      // Valid international format
      return phoneNumber;
    }
  }
  
  // First, remove all non-digit characters
  let normalized = phoneNumber.replace(/\D/g, '');
  
  // Try to match against known country patterns
  const { country, localNumber } = parsePhoneNumber('+' + normalized);
  if (country && localNumber) {
    return '+' + normalized;
  }
  
  // Legacy support: Handle US phone numbers without country code
  if (normalized.length === 10) {
    // Add US country code
    normalized = '1' + normalized;
  } else if (normalized.length === 11 && normalized.startsWith('1')) {
    // Already has US country code
    // Keep as-is
  } else if (normalized.length < 7 || normalized.length > 15) {
    // Invalid phone number length (E.164 allows 7-15 digits after country code)
    return null;
  }
  
  // Return with + prefix for E.164 format
  return '+' + normalized;
}

/**
 * Check if a string is a valid phone number
 * @param phoneNumber - The string to check
 * @returns True if valid phone number
 */
export function isValidPhoneNumber(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;
  
  // Skip demo/local identifiers
  if (phoneNumber.startsWith('demo_') || 
      phoneNumber.startsWith('local_')) {
    return false;
  }
  
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) return false;
  
  // Must have country code (start with +)
  if (!normalized.startsWith('+')) return false;
  
  // Validate using country detector
  const { country, localNumber } = parsePhoneNumber(normalized);
  return country !== null && localNumber.length >= 7;
}

/**
 * Format a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phoneNumber: string | null | undefined): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) return phoneNumber || '';
  
  // Remove + prefix for formatting
  const digits = normalized.substring(1);
  
  // Format US numbers as (XXX) XXX-XXXX
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.substring(1, 4);
    const prefix = digits.substring(4, 7);
    const lineNumber = digits.substring(7, 11);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
  
  // Return international format for other numbers
  return normalized;
}