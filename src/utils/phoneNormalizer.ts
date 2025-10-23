/**
 * Phone Number Normalization Utility
 * Ensures consistent phone number format across the application
 */

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
  
  // First, remove all non-digit characters (including hyphens, spaces, parentheses)
  let normalized = phoneNumber.replace(/\D/g, '');
  
  // Handle US phone numbers
  if (normalized.length === 10) {
    // Add US country code
    normalized = '1' + normalized;
  } else if (normalized.length === 11 && normalized.startsWith('1')) {
    // Already has US country code
    // Keep as-is
  } else if (normalized.length < 10 || normalized.length > 15) {
    // Invalid phone number length
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
  return normalized !== null && normalized.length >= 11 && normalized.length <= 16;
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