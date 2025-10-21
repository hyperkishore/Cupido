/**
 * CUPIDO PROMPT TEMPLATE ENGINE v1.0
 * ===================================
 * Revolutionary template system for dynamic prompt generation
 * Integrates with PromptManager v3.0 and Analytics Engine
 */

class PromptTemplateEngine {
  constructor() {
    this.storageKey = 'cupido_templates_v1';
    this.templates = this.loadTemplates();
    this.variables = new Map();
    this.conditionalLogic = new Map();
    
    // Integration with existing systems
    this.promptManager = window.promptManager || null;
    this.analytics = window.promptAnalytics || null;
    
    console.log('🎨 Prompt Template Engine v1.0 initialized');
  }

  // ============================================
  // TEMPLATE MANAGEMENT
  // ============================================

  loadTemplates() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return this.createDefaultTemplates();
      
      const data = JSON.parse(stored);
      console.log(`📝 Loaded ${Object.keys(data.templates || {}).length} templates`);
      return data;
    } catch (error) {
      console.error('❌ Failed to load templates:', error);
      return this.createDefaultTemplates();
    }
  }

  createDefaultTemplates() {
    return {
      schema_version: '1.0.0',
      created_at: new Date().toISOString(),
      templates: {
        // Dating App Specialized Templates
        'dating_profile_discovery': {
          id: 'dating_profile_discovery',
          name: 'Profile Discovery Conversation',
          category: 'profile_building',
          description: 'Dynamic template for discovering user personality and preferences',
          difficulty: 'intermediate',
          tags: ['profile', 'discovery', 'personality', 'adaptive'],
          template: `You are a warm, intuitive relationship coach helping {{user_name}} build their dating profile.

Based on their responses, adapt your approach:
- If {{user_personality}} === "extroverted": Use energetic, social questions
- If {{user_personality}} === "introverted": Use thoughtful, deep questions  
- If {{user_age}} < 25: Focus on growth and exploration
- If {{user_age}} >= 25: Focus on values and life goals

Current context: {{current_context}}
Previous responses: {{conversation_history}}

Ask about {{current_topic}} in a way that feels natural and engaging.

{{#if user_struggles_with_self_expression}}
"I notice you might be thoughtful about how you express yourself. That's actually a strength - it shows you're intentional about connection."
{{/if}}

Your goal: Help them discover and articulate what makes them uniquely attractive.`,
          variables: [
            { name: 'user_name', type: 'string', required: true, description: 'User\'s first name' },
            { name: 'user_personality', type: 'enum', options: ['extroverted', 'introverted', 'ambivert'], default: 'ambivert' },
            { name: 'user_age', type: 'number', required: true, description: 'User\'s age for context-appropriate questions' },
            { name: 'current_context', type: 'string', description: 'Current conversation context' },
            { name: 'conversation_history', type: 'array', description: 'Previous responses for continuity' },
            { name: 'current_topic', type: 'string', required: true, description: 'Focus area for this interaction' },
            { name: 'user_struggles_with_self_expression', type: 'boolean', default: false }
          ],
          conditional_logic: {
            personality_based_approach: 'if user_personality === "extroverted" then use energetic_questions else use_thoughtful_questions',
            age_appropriate_content: 'if user_age < 25 then focus_on_growth else focus_on_values'
          },
          performance_optimization: {
            target_response_time: 3000,
            ideal_length: 'medium',
            engagement_level: 'high'
          }
        },

        'reflection_prompt_generator': {
          id: 'reflection_prompt_generator',
          name: 'Daily Reflection Prompt Generator',
          category: 'reflection',
          description: 'Generates personalized daily reflection questions',
          difficulty: 'advanced',
          tags: ['reflection', 'personal_growth', 'daily', 'personalized'],
          template: `Generate a thoughtful reflection question for {{user_name}} based on their current life phase and interests.

User Profile:
- Age: {{user_age}}
- Relationship Status: {{relationship_status}}
- Primary Interests: {{user_interests}}
- Current Life Focus: {{life_focus}}
- Emotional State: {{current_mood}}

{{#if is_weekend}}
Weekend Reflection: Focus on personal time and self-care
{{else}}
Weekday Reflection: Focus on growth and productivity
{{/if}}

{{#switch current_mood}}
  {{#case "reflective"}}
    Create a deep, introspective question about {{life_focus}}
  {{/case}}
  {{#case "optimistic"}}
    Create an inspiring question about future possibilities
  {{/case}}
  {{#case "stressed"}}
    Create a grounding question about gratitude and perspective
  {{/case}}
  {{#default}}
    Create a balanced question that encourages self-awareness
  {{/default}}
{{/switch}}

The question should:
1. Be personally relevant to their {{life_focus}}
2. Encourage honest self-reflection
3. Be answerable in 2-3 thoughtful sentences
4. Feel supportive, not judgmental

Format as a gentle invitation, not an interrogation.`,
          variables: [
            { name: 'user_name', type: 'string', required: true },
            { name: 'user_age', type: 'number', required: true },
            { name: 'relationship_status', type: 'enum', options: ['single', 'dating', 'relationship', 'complicated'], required: true },
            { name: 'user_interests', type: 'array', description: 'User\'s main interests and hobbies' },
            { name: 'life_focus', type: 'string', description: 'Current major life focus or goal' },
            { name: 'current_mood', type: 'enum', options: ['reflective', 'optimistic', 'stressed', 'neutral'], default: 'neutral' },
            { name: 'is_weekend', type: 'boolean', default: false }
          ]
        },

        'conversation_starter_adaptive': {
          id: 'conversation_starter_adaptive',
          name: 'Adaptive Conversation Starter',
          category: 'conversation',
          description: 'Creates context-aware conversation starters between matches',
          difficulty: 'expert',
          tags: ['conversation', 'matching', 'adaptive', 'contextual'],
          template: `Create a conversation starter for {{user_name}} to send to {{match_name}}.

Shared Interests: {{shared_interests}}
Compatibility Score: {{compatibility_score}}%
Match Context: {{how_they_matched}}

{{#if compatibility_score >= 80}}
High Compatibility Approach:
Focus on your strongest shared interest: {{primary_shared_interest}}
Tone: Confident and genuinely curious
{{else if compatibility_score >= 60}}
Moderate Compatibility Approach:
Explore an intriguing difference: {{interesting_difference}}
Tone: Playfully curious
{{else}}
Discovery Approach:
Find unexpected common ground
Tone: Open and exploratory
{{/if}}

Recent Activity Context:
{{#if match_recent_activity}}
- They recently {{match_recent_activity}}
- This could be a natural conversation bridge
{{/if}}

Time Sensitivity:
{{#if is_evening}}
Evening starter: More reflective and personal
{{else if is_morning}}
Morning starter: Energetic and forward-looking
{{else}}
Midday starter: Light and engaging
{{/if}}

Create a starter that:
1. References something specific from their profile
2. Asks an open-ended question
3. Shows genuine interest
4. Invites them to share something meaningful
5. Is {{preferred_message_length}} in length

Make it feel natural, never scripted.`,
          variables: [
            { name: 'user_name', type: 'string', required: true },
            { name: 'match_name', type: 'string', required: true },
            { name: 'shared_interests', type: 'array', required: true },
            { name: 'compatibility_score', type: 'number', required: true, min: 0, max: 100 },
            { name: 'how_they_matched', type: 'string', description: 'How/why they were matched' },
            { name: 'primary_shared_interest', type: 'string' },
            { name: 'interesting_difference', type: 'string' },
            { name: 'match_recent_activity', type: 'string' },
            { name: 'is_evening', type: 'boolean', default: false },
            { name: 'is_morning', type: 'boolean', default: false },
            { name: 'preferred_message_length', type: 'enum', options: ['short', 'medium', 'long'], default: 'medium' }
          ]
        }
      },
      
      // Template Categories for Organization
      categories: {
        'profile_building': {
          name: 'Profile Building',
          description: 'Templates for helping users create compelling profiles',
          icon: '👤',
          priority: 1
        },
        'reflection': {
          name: 'Daily Reflection',
          description: 'Templates for generating personalized reflection prompts',
          icon: '🤔',
          priority: 2
        },
        'conversation': {
          name: 'Conversation Starters',
          description: 'Templates for creating engaging conversations between matches',
          icon: '💬',
          priority: 3
        },
        'matching': {
          name: 'Matching & Compatibility',
          description: 'Templates for compatibility analysis and match recommendations',
          icon: '💕',
          priority: 4
        }
      }
    };
  }

  // ============================================
  // TEMPLATE COMPILATION & RENDERING
  // ============================================

  compileTemplate(templateId, variables = {}) {
    const template = this.templates.templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Track analytics
    if (this.analytics) {
      const executionId = this.analytics.trackPromptExecution(templateId, {
        type: 'template_compilation',
        variables: Object.keys(variables),
        template_category: template.category
      });
    }

    // Validate required variables
    const missing = this.validateVariables(template, variables);
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }

    // Apply defaults
    const resolvedVariables = this.applyDefaults(template, variables);

    // Compile template with advanced logic
    try {
      const startTime = Date.now();
      const compiled = this.renderTemplate(template.template, resolvedVariables);
      const renderTime = Date.now() - startTime;

      // Track successful compilation
      if (this.analytics) {
        this.analytics.trackExecutionResult(executionId, templateId, {
          success: true,
          responseTime: renderTime,
          extractedData: { compiled_length: compiled.length }
        });
      }

      console.log(`✅ Compiled template ${templateId} (${renderTime}ms)`);
      return {
        content: compiled,
        metadata: {
          template_id: templateId,
          template_name: template.name,
          variables_used: Object.keys(resolvedVariables),
          render_time_ms: renderTime,
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      // Track compilation error
      if (this.analytics) {
        this.analytics.trackExecutionResult(executionId, templateId, {
          success: false,
          error: error.message
        });
      }
      throw error;
    }
  }

  validateVariables(template, variables) {
    const missing = [];
    
    for (const variable of template.variables || []) {
      if (variable.required && !(variable.name in variables)) {
        missing.push(variable.name);
      }
    }
    
    return missing;
  }

  applyDefaults(template, variables) {
    const resolved = { ...variables };
    
    for (const variable of template.variables || []) {
      if (!(variable.name in resolved) && variable.default !== undefined) {
        resolved[variable.name] = variable.default;
      }
    }
    
    return resolved;
  }

  renderTemplate(templateContent, variables) {
    let rendered = templateContent;

    // Replace simple variables {{variable_name}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    rendered = this.processConditionals(rendered, variables);

    // Handle switch statements {{#switch variable}}...{{/switch}}
    rendered = this.processSwitchStatements(rendered, variables);

    // Handle array iterations {{#each array}}...{{/each}}
    rendered = this.processIterations(rendered, variables);

    // Clean up extra whitespace
    rendered = rendered.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    return rendered;
  }

  processConditionals(content, variables) {
    // Handle {{#if condition}}...{{/if}} blocks
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return content.replace(ifRegex, (match, condition, block) => {
      const value = variables[condition];
      return value ? block.trim() : '';
    });
  }

  processSwitchStatements(content, variables) {
    // Handle {{#switch variable}}{{#case "value"}}...{{/case}}{{/switch}}
    const switchRegex = /\{\{#switch\s+(\w+)\}\}([\s\S]*?)\{\{\/switch\}\}/g;
    
    return content.replace(switchRegex, (match, variable, switchBody) => {
      const value = variables[variable];
      
      // Find matching case
      const caseRegex = /\{\{#case\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/case\}\}/g;
      let caseMatch;
      
      while ((caseMatch = caseRegex.exec(switchBody)) !== null) {
        if (caseMatch[1] === value) {
          return caseMatch[2].trim();
        }
      }
      
      // Check for default case
      const defaultMatch = switchBody.match(/\{\{#default\}\}([\s\S]*?)\{\{\/default\}\}/);
      return defaultMatch ? defaultMatch[1].trim() : '';
    });
  }

  processIterations(content, variables) {
    // Handle {{#each array}}...{{/each}} blocks
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return content.replace(eachRegex, (match, arrayName, block) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemBlock = block;
        
        // Replace {{this}} with current item
        itemBlock = itemBlock.replace(/\{\{this\}\}/g, item);
        
        // Replace {{@index}} with current index
        itemBlock = itemBlock.replace(/\{\{@index\}\}/g, index);
        
        return itemBlock.trim();
      }).join('\n');
    });
  }

  // ============================================
  // TEMPLATE MANAGEMENT
  // ============================================

  createTemplate(templateData) {
    const templateId = templateData.id || `template_${Date.now()}`;
    
    const template = {
      id: templateId,
      name: templateData.name,
      category: templateData.category || 'custom',
      description: templateData.description || '',
      difficulty: templateData.difficulty || 'beginner',
      tags: templateData.tags || [],
      template: templateData.template,
      variables: templateData.variables || [],
      conditional_logic: templateData.conditional_logic || {},
      performance_optimization: templateData.performance_optimization || {},
      created_at: new Date().toISOString(),
      created_by: templateData.author || 'user',
      usage_count: 0,
      success_rate: 0
    };

    this.templates.templates[templateId] = template;
    this.saveTemplates();

    console.log(`✅ Created template: ${templateData.name} → ${templateId}`);
    return templateId;
  }

  listTemplates(category = null) {
    const templates = Object.values(this.templates.templates);
    
    if (category) {
      return templates.filter(t => t.category === category);
    }
    
    return templates.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      difficulty: t.difficulty,
      tags: t.tags,
      usage_count: t.usage_count || 0,
      success_rate: t.success_rate || 0
    }));
  }

  getTemplate(templateId) {
    return this.templates.templates[templateId] || null;
  }

  // ============================================
  // INTEGRATION WITH EXISTING SYSTEMS
  // ============================================

  generatePromptFromTemplate(templateId, variables, options = {}) {
    // Compile template
    const compiled = this.compileTemplate(templateId, variables);
    
    // If PromptManager is available, create a new prompt version
    if (this.promptManager && options.saveAsPrompt) {
      const promptData = {
        name: `Generated from ${compiled.metadata.template_name}`,
        description: `Auto-generated from template ${templateId}`,
        category: 'generated',
        tags: ['template-generated'],
        template_source: templateId,
        generation_metadata: compiled.metadata
      };
      
      // This would need the promptManager to support creation - checking if it does
      console.log('🔗 Generated prompt content ready for PromptManager integration');
    }
    
    return compiled;
  }

  analyzeTemplatePerformance(templateId) {
    const template = this.templates.templates[templateId];
    if (!template) return null;

    // Get analytics data if available
    let analyticsData = null;
    if (this.analytics) {
      analyticsData = this.analytics.getPromptPerformanceReport(templateId);
    }

    return {
      template_id: templateId,
      template_name: template.name,
      usage_statistics: {
        total_compilations: template.usage_count || 0,
        success_rate: template.success_rate || 0,
        average_render_time: template.average_render_time || 0
      },
      analytics_data: analyticsData,
      optimization_suggestions: this.generateTemplateOptimizations(template, analyticsData)
    };
  }

  generateTemplateOptimizations(template, analyticsData) {
    const suggestions = [];

    // Performance suggestions
    if (template.average_render_time > 1000) {
      suggestions.push({
        type: 'performance',
        suggestion: 'Template render time is slow. Consider simplifying conditional logic.',
        priority: 'medium'
      });
    }

    // Usage suggestions
    if (template.usage_count > 100 && template.success_rate > 85) {
      suggestions.push({
        type: 'opportunity',
        suggestion: 'High-performing template! Consider creating variations for different contexts.',
        priority: 'low'
      });
    }

    return suggestions;
  }

  // ============================================
  // STORAGE & PERSISTENCE
  // ============================================

  saveTemplates() {
    try {
      this.templates.last_updated = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.templates, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Failed to save templates:', error);
      return false;
    }
  }

  exportTemplate(templateId) {
    const template = this.templates.templates[templateId];
    if (!template) return null;

    return JSON.stringify({
      schema_version: this.templates.schema_version,
      exported_at: new Date().toISOString(),
      template: template
    }, null, 2);
  }
}

// ============================================
// GLOBAL INITIALIZATION
// ============================================

if (typeof window !== 'undefined') {
  window.PromptTemplateEngine = PromptTemplateEngine;
  window.templateEngine = new PromptTemplateEngine();
  
  console.log('🎨 Template Engine ready! Co-founder will be amazed by the advanced template system!');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptTemplateEngine;
}