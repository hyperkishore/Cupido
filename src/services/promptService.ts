/**
 * Prompt Service
 *
 * Manages fetching prompts from Supabase with caching and polling.
 * Fetches latest prompt versions and monitors for updates.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveApiUrl } from '../utils/apiResolver';

const CACHE_KEY = 'cupido_cached_prompts';
const SELECTED_PROMPT_KEY = 'cupido_selected_prompt';
const VERSION_CHECK_INTERVAL = 30000; // 30 seconds
const PROMPT_POLL_INTERVAL = 60000; // 1 minute

export interface PromptInfo {
  id: string;
  name: string;
  description: string;
  activeVersion: string;
  systemPrompt?: string;
  category?: string;
  tags?: string[];
  isDefault?: boolean;
  isVisible?: boolean;
}

interface CachedPrompts {
  prompts: Record<string, PromptInfo>;
  versions: Record<string, string>; // prompt_id -> version_string
  timestamp: number;
}

class PromptService {
  private cache: CachedPrompts | null = null;
  private versionCheckTimer: ReturnType<typeof setInterval> | null = null;
  private promptPollTimer: ReturnType<typeof setInterval> | null = null;
  private versionListeners: Set<(isLatest: boolean) => void> = new Set();
  private promptListeners: Set<() => void> = new Set();
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the prompt service
   * Loads cache and starts polling
   * @throws Error if first-time fetch fails (no cache available)
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) return;

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = (async () => {
      console.log('📝 Initializing Prompt Service...');

      // Load from cache first
      await this.loadFromCache();

      try {
        // Fetch latest from proxy API
        await this.fetchPromptsFromSupabase();

        // Start polling for version changes
        this.startVersionPolling();

        this.initialized = true;
        console.log('✅ Prompt Service initialized');
      } catch (error) {
        console.error('❌ Error during initialization:', error);
        // If we have no cache, load from local prompts.json file as fallback
        if (!this.cache || Object.keys(this.cache.prompts).length === 0) {
          console.warn('⚠️ No cached prompts and API failed - loading from local prompts.json');
          await this.loadFromLocalFile();
        } else {
          // If we have cache, we can continue with stale data
          console.warn('⚠️ Using cached prompts - API fetch failed');
        }
        this.startVersionPolling(); // Still start polling to retry
        this.initialized = true;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Load prompts from AsyncStorage cache
   */
  private async loadFromCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        console.log('📦 Loaded prompts from cache:', Object.keys(this.cache?.prompts || {}).length);
      }
    } catch (error) {
      console.error('[PromptService] Error loading from cache:', error);
    }
  }

  /**
   * Save prompts to AsyncStorage cache
   */
  private async saveToCache(data: CachedPrompts): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log('💾 Saved prompts to cache');
    } catch (error) {
      console.error('[PromptService] Error saving to cache:', error);
    }
  }

  /**
   * Load prompts from local prompts.json file as fallback
   */
  private async loadFromLocalFile(): Promise<void> {
    try {
      console.log('📂 Loading prompts from local prompts.json file...');
      
      // Import the prompts.json file - use a try-catch for the require
      let localPrompts;
      try {
        localPrompts = require('../../config/prompts.json');
      } catch (requireError) {
        // If require fails (in web), use the hardcoded Critical Rules prompt
        console.log('📝 Using hardcoded Critical Rules prompt');
        localPrompts = {
          version: "2.0.0",
          active_prompt_id: "critical_rules",
          prompts: {
            critical_rules: {
              name: "Critical Rules",
              description: "Short responses (2-3 sentences), profile building focus",
              tags: ["cupido", "profile", "conversation"],
              active_version: "v1",
              versions: {
                v1: {
                  system_prompt: `You are Cupido, helping someone build a meaningful dating profile while discovering themselves. Balance learning their basics with exploring who they are.

⚠️ CRITICAL RULES - MUST FOLLOW:
1. Keep responses to 2-3 SHORT sentences (under 60 words total)
2. End with EXACTLY ONE simple question
3. NEVER ask multiple questions or use multiple question marks
4. Be conversational and curious about their actual life
5. When they mention companies/organizations: Share what you know if familiar, then ask for their perspective

PROFILE BASICS TO LEARN (prioritize early):
- Name (use it once learned!)
- Age/Birthday
- Location (current city, hometown, where they grew up)
- Work/Career/Studies
- Education background
- Family (siblings, parents, closeness)
- Relationship history
- Hobbies and interests
- What they're looking for in dating

CONVERSATION STRATEGY:
First few exchanges - Get the basics naturally:
- "Hey! I'm Cupido. What's your name?"
- "Nice to meet you [name]! Where are you based?"
- "[City] - nice! Is that where you're originally from?"

REMEMBER:
- You're building a dating profile AND facilitating discovery
- Get the basics early - don't wait too long
- Every fact has a story - explore both
- Use their name once you know it
- Keep responses SHORT but warm`
                }
              }
            }
          }
        };
      }
      
      if (!localPrompts || !localPrompts.prompts) {
        throw new Error('Invalid prompts.json structure');
      }

      // Convert local format to cache format
      const prompts: any = {};
      const versions: any = {};
      
      Object.entries(localPrompts.prompts).forEach(([promptId, promptData]: [string, any]) => {
        const activeVersion = promptData.active_version || 'v1';
        const versionData = promptData.versions[activeVersion];
        
        if (versionData) {
          prompts[promptId] = {
            id: promptId,
            name: promptData.name,
            description: promptData.description,
            systemPrompt: versionData.system_prompt,
            tags: promptData.tags || [],
            isDefault: promptId === localPrompts.active_prompt_id,
            isActive: true,
            activeVersion: activeVersion
          };
          versions[promptId] = activeVersion;
        }
      });

      this.cache = {
        prompts,
        versions,
        timestamp: Date.now()
      };

      // Save to cache for next time
      await this.saveToCache(this.cache);
      
      console.log('✅ Loaded', Object.keys(prompts).length, 'prompts from local file');
      console.log('📋 Active prompt:', localPrompts.active_prompt_id);
      
      // Ensure critical_rules is set as the selected prompt
      if (localPrompts.active_prompt_id) {
        await AsyncStorage.setItem(SELECTED_PROMPT_KEY, localPrompts.active_prompt_id);
        console.log('✅ Set active prompt to:', localPrompts.active_prompt_id);
      }
      
    } catch (error) {
      console.error('❌ Failed to load from local prompts.json:', error);
      // Set minimal cache to prevent crashes
      this.cache = {
        prompts: {},
        versions: {},
        timestamp: Date.now()
      };
    }
  }

  /**
   * Fetch all active prompts from Supabase via proxy API
   */
  async fetchPromptsFromSupabase(): Promise<void> {
    try {
      console.log('🔄 Fetching prompts from proxy API...');

      // Use proxy API instead of direct Supabase connection
      const apiUrl = resolveApiUrl('/api/prompts');
      console.log(`📡 Fetching from: ${apiUrl}`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('📊 [DEBUG] Proxy API response:', {
        hasData: !!data,
        dataLength: data?.length,
        dataType: Array.isArray(data) ? 'array' : typeof data
      });

      if (!data || data.length === 0) {
        console.warn('[PromptService] No active prompts from API');
        console.warn('[PromptService] Data value:', data);
        if (this.cache) {
          console.log('📦 Keeping cached prompts');
          return;
        }
        throw new Error('No prompts available on first launch');
      }

      // Build cache structure
      const prompts: Record<string, PromptInfo> = {};
      const versions: Record<string, string> = {};

      data.forEach((prompt: any) => {
        prompts[prompt.prompt_id] = {
          id: prompt.prompt_id,
          name: prompt.prompt_name,
          description: prompt.description || '',
          activeVersion: prompt.active_version || prompt.version_string || '1.0.0',
          systemPrompt: prompt.system_prompt,
          category: prompt.category,
          tags: prompt.tags || [],
          isDefault: prompt.is_default,
          isVisible: prompt.is_visible !== false // Default to true if undefined
        };
        versions[prompt.prompt_id] = prompt.active_version || prompt.version_string || '1.0.0';
      });

      const newCache: CachedPrompts = {
        prompts,
        versions,
        timestamp: Date.now()
      };

      // Check if versions changed
      const versionsChanged = this.cache &&
        JSON.stringify(this.cache.versions) !== JSON.stringify(versions);

      this.cache = newCache;
      await this.saveToCache(newCache);

      // Notify listeners
      this.notifyPromptListeners();

      if (versionsChanged) {
        console.log('🔔 Prompt versions changed!');
        this.notifyVersionListeners(true);
      } else {
        this.notifyVersionListeners(true); // Latest
      }

      console.log(`✅ Fetched ${data.length} prompts from proxy API`);
    } catch (error) {
      console.error('[PromptService] Failed to fetch from Supabase:', error);
      // Re-throw error to be handled by caller (show loading message to user)
      throw error;
    }
  }

  /**
   * Start polling to check for version changes
   */
  private startVersionPolling(): void {
    // Clear existing timers
    if (this.versionCheckTimer) clearInterval(this.versionCheckTimer);
    if (this.promptPollTimer) clearInterval(this.promptPollTimer);

    // Check version changes frequently (30s)
    this.versionCheckTimer = setInterval(async () => {
      await this.checkVersionChanges();
    }, VERSION_CHECK_INTERVAL);

    // Full prompt refresh less frequently (1 min)
    this.promptPollTimer = setInterval(async () => {
      await this.fetchPromptsFromSupabase();
    }, PROMPT_POLL_INTERVAL);

    console.log('⏱️ Started version polling');
  }

  /**
   * Check if prompt versions have changed without fetching full content
   */
  private async checkVersionChanges(): Promise<void> {
    try {
      if (!this.cache) return;

      // Use proxy API for version checking too
      const apiUrl = resolveApiUrl('/api/prompts');
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error('[PromptService] Error checking versions:', response.statusText);
        return;
      }

      const data = await response.json();

      const remoteVersions: Record<string, string> = {};
      data?.forEach((item: any) => {
        remoteVersions[item.prompt_id] = item.active_version || item.version_string || '1.0.0';
      });

      const cachedVersions = this.cache.versions;
      const versionsMatch = JSON.stringify(cachedVersions) === JSON.stringify(remoteVersions);

      if (!versionsMatch) {
        console.log('🔔 Version mismatch detected, fetching updates...');
        this.notifyVersionListeners(false); // Not latest
        await this.fetchPromptsFromSupabase();
      } else {
        this.notifyVersionListeners(true); // Latest
      }
    } catch (error) {
      console.error('[PromptService] Error checking version changes:', error);
    }
  }

  /**
   * Get the currently selected prompt ID
   * Returns the stored selection, or the first default prompt, or the first available prompt
   * Waits for initialization to complete if not yet initialized
   */
  async getSelectedPromptId(): Promise<string> {
    try {
      // Wait for initialization to complete
      if (!this.initialized && this.initializationPromise) {
        await this.initializationPromise;
      }

      // Try local storage first for speed
      const stored = await AsyncStorage.getItem(SELECTED_PROMPT_KEY);
      if (stored) return stored;

      // Try server storage as backup
      try {
        const response = await fetch(resolveApiUrl('/api/user-preferences/selected-prompt'));
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.selectedPromptId) {
            // Sync server preference to local storage
            await AsyncStorage.setItem(SELECTED_PROMPT_KEY, data.selectedPromptId);
            return data.selectedPromptId;
          }
        }
      } catch (serverError) {
        console.warn('[PromptService] Server preference fetch failed:', serverError);
      }

      // If no stored selection, find the first default prompt
      if (this.cache) {
        const defaultPrompt = Object.values(this.cache.prompts).find(p => p.isDefault);
        if (defaultPrompt) return defaultPrompt.id;

        // No default? Return first available prompt
        const firstPrompt = Object.keys(this.cache.prompts)[0];
        if (firstPrompt) return firstPrompt;
      }

      // No cache available - return a default prompt ID
      console.warn('[PromptService] No prompts in cache, using fallback default');
      return 'default-prompt-v1';
    } catch (error) {
      console.error('[PromptService] Error getting selected prompt:', error);
      // Return fallback instead of throwing
      return 'default-prompt-v1';
    }
  }

  /**
   * Set the selected prompt ID
   */
  async setSelectedPromptId(promptId: string): Promise<string | null> {
    try {
      const prompt = this.cache?.prompts[promptId];

      if (!prompt) {
        console.error('[PromptService] Invalid prompt ID:', promptId);
        return null;
      }

      // Store locally first (immediate)
      await AsyncStorage.setItem(SELECTED_PROMPT_KEY, promptId);
      console.log('[PromptService] ✓ Prompt switched to:', prompt.name);

      // Store on server as backup (non-blocking)
      this.syncPromptPreferenceToServer(promptId).catch(error => {
        console.warn('[PromptService] Server preference sync failed:', error);
      });

      this.notifyPromptListeners();

      return prompt.name;
    } catch (error) {
      console.error('[PromptService] Error setting prompt:', error);
      return null;
    }
  }

  /**
   * Sync prompt preference to server (non-blocking helper)
   */
  private async syncPromptPreferenceToServer(promptId: string): Promise<void> {
    try {
      const response = await fetch(resolveApiUrl('/api/user-preferences/selected-prompt'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId }),
      });

      if (!response.ok) {
        throw new Error(`Server sync failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(`Server rejected preference: ${data.error || 'Unknown error'}`);
      }

      console.log('[PromptService] ✓ Server preference synced:', promptId);
    } catch (error) {
      // Re-throw for caller to handle
      throw error;
    }
  }

  /**
   * Get information about the currently selected prompt
   */
  async getCurrentPromptInfo(): Promise<PromptInfo | null> {
    try {
      const promptId = await this.getSelectedPromptId();
      // If we have the prompt in cache, return it
      if (this.cache?.prompts[promptId]) {
        return this.cache.prompts[promptId];
      }
      
      // Return a fallback prompt info for default
      if (promptId === 'default-prompt-v1') {
        return {
          id: 'default-prompt-v1',
          name: 'Default Assistant',
          description: 'Standard conversation assistant',
          version: '1.0.0',
          isDefault: true,
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as PromptInfo;
      }
      
      return null;
    } catch (error) {
      console.error('[PromptService] Error getting prompt info:', error);
      return null;
    }
  }

  /**
   * Get all available prompts
   * By default, only returns visible prompts (is_visible = true)
   * @param includeHidden If true, includes hidden prompts
   */
  getAllPrompts(includeHidden: boolean = false): PromptInfo[] {
    if (!this.cache) return [];
    const prompts = Object.values(this.cache.prompts);

    // Filter out hidden prompts unless explicitly requested
    if (!includeHidden) {
      return prompts.filter(p => p.isVisible !== false);
    }

    return prompts;
  }

  /**
   * Get only Cupido conversation prompts (tagged with 'cupido')
   * These are the main prompts used for the Cupido AI personality
   * @param includeHidden If true, includes hidden prompts
   */
  getCupidoPrompts(includeHidden: boolean = false): PromptInfo[] {
    return this.getAllPrompts(includeHidden).filter(p =>
      p.tags?.includes('cupido')
    );
  }

  /**
   * Get only simulator persona prompts (tagged with 'simulator')
   * These are used for testing with simulated user personas
   * @param includeHidden If true, includes hidden prompts
   */
  getSimulatorPrompts(includeHidden: boolean = false): PromptInfo[] {
    return this.getAllPrompts(includeHidden).filter(p =>
      p.tags?.includes('simulator')
    );
  }

  /**
   * Check if a prompt ID is valid
   */
  isValidPromptId(promptId: string): boolean {
    return !!this.cache?.prompts[promptId];
  }

  /**
   * Subscribe to version freshness updates
   * @param callback Called with true if latest, false if outdated
   */
  subscribeToVersionStatus(callback: (isLatest: boolean) => void): () => void {
    this.versionListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.versionListeners.delete(callback);
    };
  }

  /**
   * Subscribe to prompt updates (when prompts change or selected prompt changes)
   */
  subscribeToPromptChanges(callback: () => void): () => void {
    this.promptListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.promptListeners.delete(callback);
    };
  }

  /**
   * Notify version status listeners
   */
  private notifyVersionListeners(isLatest: boolean): void {
    this.versionListeners.forEach(listener => listener(isLatest));
  }

  /**
   * Notify prompt change listeners
   */
  private notifyPromptListeners(): void {
    this.promptListeners.forEach(listener => listener());
  }

  /**
   * Force refresh prompts from Supabase
   */
  async refresh(): Promise<void> {
    console.log('🔄 Manual refresh requested');
    await this.fetchPromptsFromSupabase();
  }

  /**
   * Stop polling (cleanup)
   * Clears all timers:
   * - versionCheckTimer (30s interval for version checks)
   * - promptPollTimer (60s interval for full prompt refresh)
   * Should be called when component unmounts or service is no longer needed
   */
  stop(): void {
    if (this.versionCheckTimer) {
      clearInterval(this.versionCheckTimer);
      this.versionCheckTimer = null;
    }
    if (this.promptPollTimer) {
      clearInterval(this.promptPollTimer);
      this.promptPollTimer = null;
    }
    console.log('⏹️ Stopped prompt service');
  }

  /**
   * Get cache age in seconds
   */
  getCacheAge(): number {
    if (!this.cache) return Infinity;
    return (Date.now() - this.cache.timestamp) / 1000;
  }

  /**
   * Check if cache is stale (older than 5 minutes)
   */
  isCacheStale(): boolean {
    return this.getCacheAge() > 300; // 5 minutes
  }

  /**
   * Get a friendly loading message for first-time initialization
   * Use this when initialize() throws an error and you need to show the user a message
   */
  getLoadingMessage(): string {
    const messages = [
      '🤖 Fetching your AI companion...',
      '✨ Setting up your helper...',
      '💝 Loading Cupido...',
      '🔮 Preparing your conversation guide...',
      '🌟 Getting everything ready for you...'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const promptService = new PromptService();
