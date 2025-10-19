/**
 * Cupido Prompt Manager v3.0
 * Professional prompt storage and versioning system
 */

class PromptManager {
  constructor() {
    this.storageKey = 'cupido_prompt_registry_v3';
    this.schema_version = '3.0.0';
    this.registry = this.load();
  }

  // ============================================
  // Core Storage Operations
  // ============================================

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        console.log('[PromptManager] No stored registry found, creating empty');
        return this.createEmptyRegistry();
      }

      const data = JSON.parse(stored);

      // Handle version migration
      if (data.schema_version !== this.schema_version) {
        console.log(`[PromptManager] Migrating from ${data.schema_version} to ${this.schema_version}`);
        return this.migrate(data);
      }

      console.log(`[PromptManager] Loaded ${Object.keys(data.prompts || {}).length} prompts`);
      return data;
    } catch (error) {
      console.error('[PromptManager] Failed to load:', error);
      return this.createEmptyRegistry();
    }
  }

  save() {
    try {
      this.registry.last_sync = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.registry, null, 2));
      console.log('[PromptManager] Saved to localStorage');
      return true;
    } catch (error) {
      console.error('[PromptManager] Failed to save:', error);
      return false;
    }
  }

  createEmptyRegistry() {
    return {
      schema_version: this.schema_version,
      last_sync: new Date().toISOString(),
      prompts: {},
      settings: {
        auto_save: true,
        show_version_diff: true,
        default_label: 'production'
      }
    };
  }

  // ============================================
  // Prompt Operations
  // ============================================

  listPrompts() {
    return Object.entries(this.registry.prompts).map(([id, prompt]) => ({
      id,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags,
      active_version: prompt.active_version,
      version_count: Object.keys(prompt.versions || {}).length,
      isDefault: prompt.isDefault || false
    }));
  }

  getPrompt(promptId, version = null) {
    const prompt = this.registry.prompts[promptId];
    if (!prompt) return null;

    const targetVersion = version || prompt.active_version;
    const versionData = prompt.versions[targetVersion];

    if (!versionData) return null;

    return {
      id: promptId,
      name: prompt.name,
      description: prompt.description,
      version: targetVersion,
      content: versionData.content.system_prompt,
      metadata: versionData.metadata,
      isDefault: prompt.isDefault || false
    };
  }

  listVersions(promptId) {
    const prompt = this.registry.prompts[promptId];
    if (!prompt) return [];

    return Object.entries(prompt.versions || {})
      .map(([version, data]) => ({
        version,
        status: data.metadata.status,
        labels: data.metadata.labels || [],
        created_at: data.metadata.created_at,
        created_by: data.metadata.created_by,
        commit_message: data.metadata.commit_message || '',
        notes: data.metadata.notes || ''
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // ============================================
  // Version Management
  // ============================================

  createVersion(promptId, content, metadata = {}) {
    const prompt = this.registry.prompts[promptId];
    if (!prompt) {
      throw new Error(`Prompt ${promptId} not found`);
    }

    // Auto-increment version
    const currentVersion = prompt.active_version;
    const newVersion = this.incrementVersion(currentVersion, metadata.type || 'minor');

    // Create new version
    prompt.versions[newVersion] = {
      content: {
        system_prompt: content,
        variables: {}
      },
      metadata: {
        created_at: new Date().toISOString(),
        created_by: metadata.author || 'admin',
        status: metadata.status || 'draft',
        labels: metadata.labels || [],
        commit_message: metadata.commit_message || 'New version',
        notes: metadata.notes || '',
        parent_version: currentVersion
      }
    };

    this.save();
    console.log(`[PromptManager] Created version ${newVersion} for ${promptId}`);

    return newVersion;
  }

  activateVersion(promptId, version) {
    const prompt = this.registry.prompts[promptId];
    if (!prompt || !prompt.versions[version]) {
      throw new Error(`Version ${version} not found for prompt ${promptId}`);
    }

    // Update statuses
    const oldVersion = prompt.active_version;
    if (oldVersion && prompt.versions[oldVersion]) {
      prompt.versions[oldVersion].metadata.status = 'deprecated';
    }

    prompt.active_version = version;
    prompt.versions[version].metadata.status = 'active';
    prompt.versions[version].metadata.activated_at = new Date().toISOString();

    this.save();
    console.log(`[PromptManager] Activated version ${version} for ${promptId}`);

    return { oldVersion, newVersion: version };
  }

  incrementVersion(currentVersion, type = 'patch') {
    const parts = currentVersion.split('.').map(Number);

    switch(type) {
      case 'major':
        return `${parts[0] + 1}.0.0`;
      case 'minor':
        return `${parts[0]}.${parts[1] + 1}.0`;
      case 'patch':
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      default:
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
  }

  // ============================================
  // Migration from v2 Format
  // ============================================

  migrate(oldData) {
    if (oldData.version === '2.0.0' || (oldData.prompts && !oldData.schema_version)) {
      return this.migrateFromV2(oldData);
    }

    // Unknown format
    console.warn('[PromptManager] Unknown format, creating empty registry');
    return this.createEmptyRegistry();
  }

  migrateFromV2(v2Data) {
    console.log('[PromptManager] Migrating from v2.0.0 format');

    const newRegistry = this.createEmptyRegistry();

    for (const [promptId, promptData] of Object.entries(v2Data.prompts || {})) {
      const versions = {};

      // Convert each version
      for (const [vKey, vData] of Object.entries(promptData.versions || {})) {
        // Convert v1 → 1.0.0, v2 → 2.0.0
        const semanticVersion = this.versionKeyToSemantic(vKey);

        versions[semanticVersion] = {
          content: {
            system_prompt: vData.system_prompt || '',
            variables: {}
          },
          metadata: {
            created_at: vData.created_at || new Date().toISOString(),
            created_by: 'migration',
            status: vKey === promptData.active_version ? 'active' : 'archived',
            labels: vKey === promptData.active_version ? ['production'] : [],
            commit_message: vData.notes || 'Migrated from v2',
            notes: vData.notes || ''
          }
        };
      }

      newRegistry.prompts[promptId] = {
        id: promptId,
        name: promptData.name || promptId.replace(/_/g, ' ').toUpperCase(),
        description: promptData.description || '',
        category: 'conversation',
        tags: this.generateTags(promptData.description || ''),
        active_version: this.versionKeyToSemantic(promptData.active_version),
        versions: versions,
        isDefault: true
      };
    }

    this.registry = newRegistry;
    this.save();

    console.log(`[PromptManager] Migration complete: ${Object.keys(newRegistry.prompts).length} prompts`);

    return newRegistry;
  }

  versionKeyToSemantic(versionKey) {
    // Convert v1, v2 to 1.0.0, 2.0.0
    const match = versionKey.match(/v(\d+)/);
    if (match) {
      return `${match[1]}.0.0`;
    }
    return versionKey;
  }

  generateTags(description) {
    const tagMap = {
      'short': 'concise',
      'profile': 'profile-building',
      'discovery': 'self-discovery',
      'conversation': 'interactive',
      'brief': 'concise'
    };

    const tags = [];
    const lowerDesc = description.toLowerCase();

    for (const [keyword, tag] of Object.entries(tagMap)) {
      if (lowerDesc.includes(keyword)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  // ============================================
  // Import from JSON File
  // ============================================

  async importFromFile(url) {
    try {
      console.log(`[PromptManager] Importing from ${url}`);
      const response = await fetch(url);
      const data = await response.json();

      // Detect format and migrate
      const migrated = this.migrate(data);
      this.registry = migrated;
      this.save();

      console.log(`[PromptManager] Imported ${Object.keys(this.registry.prompts).length} prompts`);

      return this.listPrompts();
    } catch (error) {
      console.error('[PromptManager] Import failed:', error);
      throw error;
    }
  }

  // ============================================
  // Export
  // ============================================

  exportPrompt(promptId, version = null) {
    const prompt = this.registry.prompts[promptId];
    if (!prompt) return null;

    const exportData = {
      schema_version: this.schema_version,
      exported_at: new Date().toISOString(),
      prompt: {
        id: promptId,
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        tags: prompt.tags,
        versions: version ? { [version]: prompt.versions[version] } : prompt.versions,
        active_version: version || prompt.active_version
      }
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Export singleton instance
if (typeof window !== 'undefined') {
  window.PromptManager = PromptManager;
  window.promptManager = new PromptManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptManager;
}
