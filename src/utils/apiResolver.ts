/**
 * Centralized API URL Resolution
 * Handles platform-specific URL resolution for API endpoints
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve API endpoint URL based on environment and platform
 * @param endpoint The API endpoint path (e.g., '/api/chat', '/api/prompts')
 * @returns Full URL to the API endpoint
 */
export function resolveApiUrl(endpoint: string): string {
  const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
  const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

  // If explicit proxy URL is configured, use it
  if (envProxyUrl) {
    // Avoid double slashes if URL already ends with the endpoint
    if (envProxyUrl.endsWith(endpoint)) {
      return envProxyUrl;
    }
    // Remove trailing slash from base URL and leading slash from endpoint if present
    const baseUrl = envProxyUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  // Check if we're in a web browser environment
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    const hostname = window.location.hostname;

    // Production environment (Netlify)
    if (hostname === 'cupido-dating-app.netlify.app' || hostname.includes('netlify.app')) {
      // Use Netlify function for production
      if (endpoint.startsWith('/api/')) {
        return `/.netlify/functions${endpoint.replace('/api', '')}`;
      }
      return `/.netlify/functions${endpoint}`;
    }

    // Development - accessed via IP address (mobile on same network)
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${hostname}:3001${endpoint}`;
    }

    // Development - localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:3001${endpoint}`;
    }

    // Development - any other hostname (.local, custom domains, tunnels)
    // Treat as development and use current hostname with port 3001
    return `http://${hostname}:3001${endpoint}`;
  }

  // React Native mobile environments
  // Try to get host from Expo's debugger host (works on physical devices)
  const debuggerHost = Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3001${endpoint}`;
  }

  // Fallback for React Native
  if (Platform.OS === 'android') {
    // Android emulator
    return `http://10.0.2.2:3001${endpoint}`;
  }

  // iOS simulator (won't work on physical device without proper configuration)
  return `http://127.0.0.1:3001${endpoint}`;
}

/**
 * Get the base API URL (useful for logging/debugging)
 */
export function getApiBaseUrl(): string {
  return resolveApiUrl('').replace(/\/$/, '');
}
