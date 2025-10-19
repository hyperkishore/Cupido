/**
 * Prompt Repository - Supabase Storage
 *
 * This service manages prompts in Supabase with full version control
 * Prompts are NEVER deleted - only new versions created
 * Each change is tracked with Git commit information
 */

import { supabase } from './supabase';

export interface PromptVersion {
  id: string;
  prompt_id: string;
  prompt_name: string;
  major_version: number;
  minor_version: number;
  patch_version: number;
  version_string: string;
  status: 'draft' | 'active' | 'archived' | 'deprecated';
  is_active: boolean;
  system_prompt: string;
  description?: string;
  category: string;
  tags: string[];
  labels: string[];
  created_at: string;
  created_by: string;
  commit_message?: string;
  notes?: string;
  parent_version_id?: string;
  source_file?: string;
  is_default: boolean;
}

export interface PromptSummary {
  prompt_id: string;
  prompt_name: string;
  active_version: string;
  version_count: number;
  category: string;
  description?: string;
  is_default: boolean;
  tags: string[];
}

class PromptRepositoryClass {
  // ============================================
  // LIST PROMPTS
  // ============================================

  async listPrompts(): Promise<PromptSummary[]> {
    try {
      console.log('📋 Fetching all prompts with active versions...');

      // Get all active versions
      const { data: activeVersions, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('is_active', true)
        .order('prompt_id');

      if (error) {
        console.error('Error fetching prompts:', error);
        return [];
      }

      if (!activeVersions || activeVersions.length === 0) {
        console.log('⚠️  No active prompts found in database');
        return [];
      }

      // For each prompt, get version count
      const summaries: PromptSummary[] = await Promise.all(
        activeVersions.map(async (active) => {
          const { count } = await supabase
            .from('prompt_versions')
            .select('id', { count: 'exact', head: true })
            .eq('prompt_id', active.prompt_id);

          return {
            prompt_id: active.prompt_id,
            prompt_name: active.prompt_name,
            active_version: active.version_string,
            version_count: count || 1,
            category: active.category,
            description: active.description,
            is_default: active.is_default,
            tags: active.tags || [],
          };
        })
      );

      console.log(`✅ Found ${summaries.length} prompts`);
      return summaries;
    } catch (error) {
      console.error('Error in listPrompts:', error);
      return [];
    }
  }

  // ============================================
  // GET PROMPT (specific version or active)
  // ============================================

  async getPrompt(promptId: string, version?: string): Promise<PromptVersion | null> {
    try {
      console.log(`🔍 Fetching prompt: ${promptId}${version ? ` v${version}` : ' (active)'}`);

      let query = supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId);

      if (version) {
        // Parse version string (e.g., "1.2.3")
        const [major, minor, patch] = version.split('.').map(Number);
        query = query
          .eq('major_version', major)
          .eq('minor_version', minor)
          .eq('patch_version', patch);
      } else {
        // Get active version
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching prompt:', error);
        return null;
      }

      if (!data) {
        console.log(`⚠️  Prompt not found: ${promptId}`);
        return null;
      }

      console.log(`✅ Loaded prompt: ${data.prompt_name} v${data.version_string}`);
      return data;
    } catch (error) {
      console.error('Error in getPrompt:', error);
      return null;
    }
  }

  // ============================================
  // LIST VERSIONS
  // ============================================

  async listVersions(promptId: string): Promise<PromptVersion[]> {
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('major_version', { ascending: false })
        .order('minor_version', { ascending: false })
        .order('patch_version', { ascending: false });

      if (error) {
        console.error('Error fetching versions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in listVersions:', error);
      return [];
    }
  }

  // ============================================
  // CREATE VERSION
  // ============================================

  async createVersion(
    promptId: string,
    promptName: string,
    systemPrompt: string,
    options: {
      versionType?: 'major' | 'minor' | 'patch';
      commitMessage?: string;
      notes?: string;
      createdBy?: string;
      activate?: boolean;
      description?: string;
      category?: string;
      tags?: string[];
    } = {}
  ): Promise<string | null> {
    try {
      console.log(`📝 Creating new ${options.versionType || 'patch'} version for: ${promptId}`);

      const { data, error } = await supabase.rpc('create_prompt_version', {
        p_prompt_id: promptId,
        p_prompt_name: promptName,
        p_system_prompt: systemPrompt,
        p_version_type: options.versionType || 'patch',
        p_commit_message: options.commitMessage || 'Updated via dashboard',
        p_notes: options.notes || '',
        p_created_by: options.createdBy || 'admin',
        p_activate: options.activate || false,
      });

      if (error) {
        console.error('Error creating version:', error);
        return null;
      }

      console.log(`✅ Created new version: ${data}`);
      return data; // Returns UUID of new version
    } catch (error) {
      console.error('Error in createVersion:', error);
      return null;
    }
  }

  // ============================================
  // ACTIVATE VERSION
  // ============================================

  async activateVersion(promptId: string, versionString: string): Promise<boolean> {
    try {
      console.log(`🔄 Activating version ${versionString} for: ${promptId}`);

      const [major, minor, patch] = versionString.split('.').map(Number);

      // Update the specific version to active
      const { error } = await supabase
        .from('prompt_versions')
        .update({
          is_active: true,
          status: 'active',
        })
        .eq('prompt_id', promptId)
        .eq('major_version', major)
        .eq('minor_version', minor)
        .eq('patch_version', patch);

      if (error) {
        console.error('Error activating version:', error);
        return false;
      }

      console.log(`✅ Activated version ${versionString}`);
      return true;
    } catch (error) {
      console.error('Error in activateVersion:', error);
      return false;
    }
  }

  // ============================================
  // IMPORT FROM JSON FILE
  // ============================================

  async importFromFile(filePath: string): Promise<number> {
    try {
      console.log(`📥 Importing prompts from: ${filePath}`);

      // Fetch the file
      const response = await fetch(filePath);
      const data = await response.json();

      if (!data.prompts) {
        console.error('Invalid prompts file format');
        return 0;
      }

      let importedCount = 0;

      // Import each prompt
      for (const [promptId, promptData] of Object.entries(data.prompts as any)) {
        // Check if prompt already exists
        const existing = await this.getPrompt(promptId);
        if (existing) {
          console.log(`⏭️  Skipping existing prompt: ${promptId}`);
          continue;
        }

        // Get the active version from the file
        const activeVersionKey = promptData.active_version || 'v1';
        const activeVersionData = promptData.versions[activeVersionKey];

        if (!activeVersionData) {
          console.error(`No version data found for ${promptId}`);
          continue;
        }

        // Create the initial version
        const { error } = await supabase
          .from('prompt_versions')
          .insert({
            prompt_id: promptId,
            prompt_name: promptData.name || promptId,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
            system_prompt: activeVersionData.system_prompt || activeVersionData,
            description: promptData.description || '',
            category: 'conversation',
            tags: [],
            labels: ['production'],
            status: 'active',
            is_active: true,
            commit_message: activeVersionData.notes || 'Imported from prompts.json',
            created_by: 'migration',
            source_file: filePath,
            is_default: true,
          });

        if (error) {
          console.error(`Error importing ${promptId}:`, error);
          continue;
        }

        console.log(`✅ Imported: ${promptId}`);
        importedCount++;
      }

      console.log(`✅ Import complete: ${importedCount} prompts imported`);
      return importedCount;
    } catch (error) {
      console.error('Error in importFromFile:', error);
      return 0;
    }
  }

  // ============================================
  // EXPORT PROMPT
  // ============================================

  async exportPrompt(promptId: string, version?: string): Promise<string | null> {
    try {
      const prompt = await this.getPrompt(promptId, version);
      if (!prompt) return null;

      const versions = await this.listVersions(promptId);

      const exportData = {
        schema_version: '3.0.0',
        exported_at: new Date().toISOString(),
        prompt: {
          id: promptId,
          name: prompt.prompt_name,
          description: prompt.description,
          category: prompt.category,
          tags: prompt.tags,
          versions: versions.reduce((acc, v) => {
            acc[v.version_string] = {
              system_prompt: v.system_prompt,
              status: v.status,
              created_at: v.created_at,
              commit_message: v.commit_message,
              notes: v.notes,
            };
            return acc;
          }, {} as any),
          active_version: prompt.version_string,
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error in exportPrompt:', error);
      return null;
    }
  }

  // ============================================
  // RECORD GIT COMMIT
  // ============================================

  async recordGitCommit(
    versionId: string,
    commitHash: string,
    branch: string = 'main',
    author?: string,
    message?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompt_git_commits')
        .insert({
          prompt_version_id: versionId,
          git_commit_hash: commitHash,
          git_branch: branch,
          git_author: author,
          git_message: message,
        });

      if (error) {
        console.error('Error recording git commit:', error);
        return false;
      }

      console.log(`✅ Recorded git commit: ${commitHash}`);
      return true;
    } catch (error) {
      console.error('Error in recordGitCommit:', error);
      return false;
    }
  }
}

export const promptRepository = new PromptRepositoryClass();
