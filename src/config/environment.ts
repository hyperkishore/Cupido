/**
 * Environment Configuration
 * Centralized configuration for all environments
 */

export interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    webUrl: string;
  };
  api: {
    baseUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    voiceInput: boolean;
    feedbackSystem: boolean;
    pushNotifications: boolean;
    analytics: boolean;
    voiceNotes: boolean;
    videoCalls: boolean;
    aiMatching: boolean;
  };
  limits: {
    maxDailyReflections: number;
    maxDailyMatches: number;
    maxDailyMessages: number;
  };
  debug: {
    showDevTools: boolean;
    debugMode: boolean;
  };
}

// Get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof window !== 'undefined') {
    // Web environment - check window.ENV or process.env
    return (window as any).ENV?.[key] || process.env[key] || fallback;
  }
  // React Native environment
  return process.env[key] || fallback;
};

const getBooleanEnvVar = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key);
  return value.toLowerCase() === 'true';
};

const getNumberEnvVar = (key: string, fallback: number): number => {
  const value = getEnvVar(key);
  return value ? parseInt(value, 10) : fallback;
};

// Environment configuration
export const environment: EnvironmentConfig = {
  app: {
    name: getEnvVar('EXPO_PUBLIC_APP_NAME', 'Cupido'),
    version: getEnvVar('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('EXPO_PUBLIC_ENVIRONMENT', 'development') as any),
    webUrl: getEnvVar('EXPO_PUBLIC_WEB_URL', 'http://localhost:8081'),
  },
  api: {
    baseUrl: getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:3000/api'),
  },
  supabase: {
    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', ''),
    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
  },
  features: {
    voiceInput: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_VOICE_INPUT', true),
    feedbackSystem: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_FEEDBACK_SYSTEM', true),
    pushNotifications: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS', false),
    analytics: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_ANALYTICS', false),
    voiceNotes: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_VOICE_NOTES', true),
    videoCalls: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_VIDEO_CALLS', false),
    aiMatching: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_AI_MATCHING', true),
  },
  limits: {
    maxDailyReflections: getNumberEnvVar('EXPO_PUBLIC_MAX_DAILY_REFLECTIONS', 5),
    maxDailyMatches: getNumberEnvVar('EXPO_PUBLIC_MAX_DAILY_MATCHES', 10),
    maxDailyMessages: getNumberEnvVar('EXPO_PUBLIC_MAX_DAILY_MESSAGES', 100),
  },
  debug: {
    showDevTools: getBooleanEnvVar('EXPO_PUBLIC_SHOW_DEV_TOOLS', false),
    debugMode: getBooleanEnvVar('EXPO_PUBLIC_DEBUG_MODE', false),
  },
};

// Helper functions
export const isDevelopment = () => environment.app.environment === 'development';
export const isProduction = () => environment.app.environment === 'production';
export const isStaging = () => environment.app.environment === 'staging';

// Feature flags
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return environment.features[feature];
};

// API endpoints
export const getApiUrl = (path: string): string => {
  return `${environment.api.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Console logging wrapper that respects debug mode
export const debugLog = (...args: any[]): void => {
  if (environment.debug.debugMode) {
    console.log('[Cupido Debug]', ...args);
  }
};

export const debugWarn = (...args: any[]): void => {
  if (environment.debug.debugMode) {
    console.warn('[Cupido Debug]', ...args);
  }
};

export const debugError = (...args: any[]): void => {
  if (environment.debug.debugMode) {
    console.error('[Cupido Debug]', ...args);
  }
};

export default environment;