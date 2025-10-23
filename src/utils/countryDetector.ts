/**
 * Country Detection and Phone Code Management
 * Auto-detects user's country for phone number formatting
 */

export interface CountryInfo {
  code: string;      // ISO country code (US, IN, GB, etc)
  name: string;      // Country name
  dialCode: string;  // Phone dial code (+1, +91, +44, etc)
  flag: string;      // Flag emoji
  regex?: RegExp;    // Phone number validation pattern
}

// Common countries with their dial codes
export const COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', regex: /^\d{10}$/ },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', regex: /^\d{10}$/ },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', regex: /^\d{10}$/ },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', regex: /^\d{10,11}$/ },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', regex: /^\d{9}$/ },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', regex: /^\d{10,11}$/ },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', regex: /^\d{11}$/ },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', regex: /^\d{9}$/ },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', regex: /^\d{10,11}$/ },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', regex: /^\d{10}$/ },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', regex: /^\d{10}$/ },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', regex: /^\d{10}$/ },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', regex: /^\d{9}$/ },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', regex: /^\d{9}$/ },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', regex: /^\d{9}$/ },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', regex: /^\d{8}$/ },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', regex: /^\d{9,10}$/ },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', regex: /^\d{9}$/ },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', regex: /^\d{10}$/ },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', regex: /^\d{9}$/ },
];

/**
 * Detect country using Geolocation API
 * Falls back to IP-based detection if GPS is unavailable
 */
export async function detectCountry(): Promise<CountryInfo | null> {
  try {
    // Method 1: Try GPS-based location
    if ('geolocation' in navigator) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { timeout: 5000, enableHighAccuracy: false }
        );
      }).catch(() => null);

      if (position) {
        // Use reverse geocoding service
        const { latitude, longitude } = position.coords;
        const geoResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        ).catch(() => null);

        if (geoResponse?.ok) {
          const data = await geoResponse.json();
          const countryCode = data.countryCode;
          const country = COUNTRIES.find(c => c.code === countryCode);
          if (country) return country;
        }
      }
    }

    // Method 2: Fall back to IP-based detection
    const ipResponse = await fetch('https://ipapi.co/json/').catch(() => null);
    if (ipResponse?.ok) {
      const data = await ipResponse.json();
      const country = COUNTRIES.find(c => c.code === data.country_code);
      if (country) return country;
    }

    // Method 3: Use browser language as last resort
    const browserLang = navigator.language || 'en-US';
    const countryCode = browserLang.split('-')[1]?.toUpperCase();
    if (countryCode) {
      const country = COUNTRIES.find(c => c.code === countryCode);
      if (country) return country;
    }

    // Default to US if all methods fail
    return COUNTRIES[0];
  } catch (error) {
    console.error('Country detection failed:', error);
    return COUNTRIES[0]; // Default to US
  }
}

/**
 * Format phone number with country code
 */
export function formatPhoneWithCountry(phone: string, country: CountryInfo): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if already present
  const dialCodeDigits = country.dialCode.replace(/\D/g, '');
  let cleanNumber = digits;
  if (digits.startsWith(dialCodeDigits)) {
    cleanNumber = digits.substring(dialCodeDigits.length);
  }
  
  // Validate against country pattern
  if (country.regex && !country.regex.test(cleanNumber)) {
    throw new Error(`Invalid phone number format for ${country.name}`);
  }
  
  return country.dialCode + cleanNumber;
}

/**
 * Parse phone number to extract country and local number
 */
export function parsePhoneNumber(fullNumber: string): { country: CountryInfo | null, localNumber: string } {
  const digits = fullNumber.replace(/\D/g, '');
  
  // Try to match country by dial code
  for (const country of COUNTRIES) {
    const dialCodeDigits = country.dialCode.replace(/\D/g, '');
    if (digits.startsWith(dialCodeDigits)) {
      const localNumber = digits.substring(dialCodeDigits.length);
      if (!country.regex || country.regex.test(localNumber)) {
        return { country, localNumber };
      }
    }
  }
  
  return { country: null, localNumber: digits };
}

/**
 * Validate phone number for a specific country
 */
export function validatePhoneForCountry(phone: string, country: CountryInfo): boolean {
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if present
  const dialCodeDigits = country.dialCode.replace(/\D/g, '');
  let localNumber = digits;
  if (digits.startsWith(dialCodeDigits)) {
    localNumber = digits.substring(dialCodeDigits.length);
  }
  
  return country.regex ? country.regex.test(localNumber) : localNumber.length >= 7;
}