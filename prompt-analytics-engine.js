/**
 * CUPIDO PROMPT ANALYTICS ENGINE v1.0
 * ===================================
 * Revolutionary prompt performance tracking and optimization system
 * Built to surprise the co-founder with advanced analytics capabilities
 */

class PromptAnalyticsEngine {
  constructor() {
    this.storageKey = 'cupido_prompt_analytics_v1';
    this.sessionKey = 'cupido_current_session';
    this.analytics = this.loadAnalytics();
    this.currentSession = this.initializeSession();
    
    console.log('🔬 Prompt Analytics Engine v1.0 initialized');
  }

  // ============================================
  // ANALYTICS DATA STRUCTURE
  // ============================================

  loadAnalytics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return this.createEmptyAnalytics();
      
      const data = JSON.parse(stored);
      console.log(`📊 Loaded analytics for ${Object.keys(data.prompts || {}).length} prompts`);
      return data;
    } catch (error) {
      console.error('❌ Failed to load analytics:', error);
      return this.createEmptyAnalytics();
    }
  }

  createEmptyAnalytics() {
    return {
      schema_version: '1.0.0',
      initialized_at: new Date().toISOString(),
      last_analysis: null,
      global_stats: {
        total_executions: 0,
        total_users: 0,
        average_session_duration: 0,
        most_popular_category: null,
        peak_usage_hour: null
      },
      prompts: {},
      sessions: {},
      ab_tests: {},
      performance_benchmarks: {}
    };
  }

  // ============================================
  // REAL-TIME EXECUTION TRACKING
  // ============================================

  trackPromptExecution(promptId, metadata = {}) {
    const sessionId = this.currentSession.id;
    const timestamp = new Date().toISOString();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize prompt analytics if not exists
    if (!this.analytics.prompts[promptId]) {
      this.analytics.prompts[promptId] = {
        id: promptId,
        created_at: timestamp,
        executions: {},
        performance_metrics: {
          total_uses: 0,
          success_rate: 0,
          average_response_time: 0,
          user_satisfaction_score: 0,
          effectiveness_rating: 0,
          conversion_rate: 0
        },
        usage_patterns: {
          peak_hours: {},
          popular_contexts: {},
          user_demographics: {},
          device_preferences: {}
        },
        a_b_test_results: {},
        optimization_suggestions: []
      };
    }

    // Record execution
    const execution = {
      id: executionId,
      session_id: sessionId,
      timestamp,
      prompt_version: metadata.version || 'unknown',
      context: metadata.context || 'general',
      user_agent: navigator.userAgent || 'unknown',
      response_time_ms: null,
      success: null,
      user_feedback: null,
      extracted_data: null,
      error_details: null,
      metadata: metadata
    };

    this.analytics.prompts[promptId].executions[executionId] = execution;
    this.analytics.prompts[promptId].performance_metrics.total_uses++;
    this.analytics.global_stats.total_executions++;

    this.saveAnalytics();
    console.log(`📈 Tracked execution: ${promptId} → ${executionId}`);

    return executionId;
  }

  trackExecutionResult(executionId, promptId, result) {
    const prompt = this.analytics.prompts[promptId];
    if (!prompt || !prompt.executions[executionId]) {
      console.warn(`⚠️ Execution ${executionId} not found for prompt ${promptId}`);
      return;
    }

    const execution = prompt.executions[executionId];
    execution.response_time_ms = result.responseTime || null;
    execution.success = result.success || false;
    execution.extracted_data = result.extractedData || null;
    execution.error_details = result.error || null;
    execution.completed_at = new Date().toISOString();

    // Update performance metrics
    this.updatePerformanceMetrics(promptId);
    this.saveAnalytics();

    console.log(`✅ Updated execution result: ${executionId} → ${result.success ? 'SUCCESS' : 'FAILED'}`);
  }

  // ============================================
  // PERFORMANCE ANALYTICS
  // ============================================

  updatePerformanceMetrics(promptId) {
    const prompt = this.analytics.prompts[promptId];
    if (!prompt) return;

    const executions = Object.values(prompt.executions);
    const completedExecutions = executions.filter(e => e.completed_at);

    if (completedExecutions.length === 0) return;

    // Calculate success rate
    const successfulExecutions = completedExecutions.filter(e => e.success);
    prompt.performance_metrics.success_rate = 
      (successfulExecutions.length / completedExecutions.length) * 100;

    // Calculate average response time
    const responseTimes = completedExecutions
      .filter(e => e.response_time_ms)
      .map(e => e.response_time_ms);
    
    if (responseTimes.length > 0) {
      prompt.performance_metrics.average_response_time = 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Update usage patterns
    this.updateUsagePatterns(promptId, completedExecutions);
    
    // Generate optimization suggestions
    this.generateOptimizationSuggestions(promptId);

    console.log(`📊 Updated performance metrics for ${promptId}`);
  }

  updateUsagePatterns(promptId, executions) {
    const prompt = this.analytics.prompts[promptId];
    const patterns = prompt.usage_patterns;

    // Peak hours analysis
    executions.forEach(exec => {
      const hour = new Date(exec.timestamp).getHours();
      patterns.peak_hours[hour] = (patterns.peak_hours[hour] || 0) + 1;
    });

    // Context analysis
    executions.forEach(exec => {
      const context = exec.context || 'unknown';
      patterns.popular_contexts[context] = (patterns.popular_contexts[context] || 0) + 1;
    });
  }

  generateOptimizationSuggestions(promptId) {
    const prompt = this.analytics.prompts[promptId];
    const metrics = prompt.performance_metrics;
    const suggestions = [];

    // Success rate suggestions
    if (metrics.success_rate < 70) {
      suggestions.push({
        type: 'success_rate',
        priority: 'high',
        suggestion: 'Success rate below 70%. Consider revising prompt clarity or context.',
        action: 'review_prompt_structure',
        created_at: new Date().toISOString()
      });
    }

    // Response time suggestions
    if (metrics.average_response_time > 5000) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        suggestion: 'Response time above 5 seconds. Consider prompt optimization.',
        action: 'optimize_prompt_length',
        created_at: new Date().toISOString()
      });
    }

    // Usage pattern suggestions
    const executions = Object.values(prompt.executions);
    if (executions.length > 50 && metrics.success_rate > 85) {
      suggestions.push({
        type: 'opportunity',
        priority: 'low',
        suggestion: 'High-performing prompt! Consider using as template for similar contexts.',
        action: 'create_template',
        created_at: new Date().toISOString()
      });
    }

    prompt.optimization_suggestions = suggestions;
  }

  // ============================================
  // A/B TESTING FRAMEWORK
  // ============================================

  createABTest(name, promptId, variants, config = {}) {
    const testId = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const abTest = {
      id: testId,
      name,
      prompt_id: promptId,
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: config.author || 'system',
      variants: variants.map((variant, index) => ({
        id: `variant_${index}`,
        name: variant.name,
        prompt_content: variant.content,
        traffic_allocation: variant.allocation || (100 / variants.length),
        executions: 0,
        conversions: 0,
        metrics: {
          success_rate: 0,
          average_response_time: 0,
          user_satisfaction: 0
        }
      })),
      config: {
        duration_days: config.duration || 7,
        min_sample_size: config.minSampleSize || 100,
        significance_threshold: config.significanceThreshold || 0.05,
        primary_metric: config.primaryMetric || 'success_rate'
      },
      results: {
        winner: null,
        confidence_level: 0,
        statistical_significance: false,
        recommendation: null
      }
    };

    this.analytics.ab_tests[testId] = abTest;
    this.saveAnalytics();

    console.log(`🧪 Created A/B test: ${name} → ${testId}`);
    return testId;
  }

  getABTestVariant(testId) {
    const test = this.analytics.ab_tests[testId];
    if (!test || test.status !== 'active') return null;

    // Simple traffic allocation based on random selection
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.traffic_allocation;
      if (rand <= cumulative) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback
  }

  // Alias methods for test compatibility
  startABTest(name, variantA, variantB, config = {}) {
    return this.createABTest(name, 'default', [
      { name: 'A', content: variantA },
      { name: 'B', content: variantB }
    ], config);
  }

  logABTestResult(testId, variant, converted, metadata = {}) {
    const test = this.analytics.ab_tests[testId];
    if (!test) return;

    const variantObj = test.variants.find(v => v.id === variant || v.name === variant);
    if (!variantObj) return;

    variantObj.executions++;
    if (converted) variantObj.conversions++;

    // Update metrics
    variantObj.metrics.success_rate = (variantObj.conversions / variantObj.executions) * 100;
    
    this.saveAnalytics();
    return true;
  }

  calculateStatisticalSignificance(testId) {
    const test = this.analytics.ab_tests[testId];
    if (!test || test.variants.length !== 2) return null;

    const [variantA, variantB] = test.variants;
    
    const rateA = variantA.conversions / variantA.executions || 0;
    const rateB = variantB.conversions / variantB.executions || 0;
    
    const pooledRate = (variantA.conversions + variantB.conversions) / 
                      (variantA.executions + variantB.executions);
    
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * 
                          (1/variantA.executions + 1/variantB.executions));
    
    if (standardError === 0) return null;
    
    const zScore = Math.abs(rateA - rateB) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      pValue,
      zScore,
      significant: pValue < (test.config.significance_threshold || 0.05),
      winner: rateB > rateA ? 'B' : 'A',
      improvement: rateA > 0 ? ((rateB - rateA) / rateA * 100) : 0
    };
  }

  normalCDF(z) {
    // Approximation of normal cumulative distribution function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  // ============================================
  // ADVANCED ANALYTICS QUERIES
  // ============================================

  getPromptPerformanceReport(promptId) {
    const prompt = this.analytics.prompts[promptId];
    if (!prompt) return null;

    const executions = Object.values(prompt.executions);
    const recentExecutions = executions.filter(e => {
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return new Date(e.timestamp).getTime() > dayAgo;
    });

    return {
      prompt_id: promptId,
      generated_at: new Date().toISOString(),
      summary: {
        total_executions: executions.length,
        recent_executions_24h: recentExecutions.length,
        success_rate: prompt.performance_metrics.success_rate,
        average_response_time: prompt.performance_metrics.average_response_time,
        trend: this.calculateTrend(promptId)
      },
      usage_patterns: prompt.usage_patterns,
      optimization_suggestions: prompt.optimization_suggestions,
      ranking: this.getPromptRanking(promptId)
    };
  }

  calculateTrend(promptId) {
    const prompt = this.analytics.prompts[promptId];
    const executions = Object.values(prompt.executions)
      .filter(e => e.completed_at)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (executions.length < 10) return 'insufficient_data';

    const midpoint = Math.floor(executions.length / 2);
    const firstHalf = executions.slice(0, midpoint);
    const secondHalf = executions.slice(midpoint);

    const firstHalfSuccess = firstHalf.filter(e => e.success).length / firstHalf.length;
    const secondHalfSuccess = secondHalf.filter(e => e.success).length / secondHalf.length;

    const difference = secondHalfSuccess - firstHalfSuccess;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  getPromptRanking(promptId) {
    const allPrompts = Object.values(this.analytics.prompts);
    const sorted = allPrompts
      .filter(p => p.performance_metrics.total_uses > 0)
      .sort((a, b) => {
        // Composite score: success rate * usage frequency
        const scoreA = a.performance_metrics.success_rate * Math.log(a.performance_metrics.total_uses + 1);
        const scoreB = b.performance_metrics.success_rate * Math.log(b.performance_metrics.total_uses + 1);
        return scoreB - scoreA;
      });

    const rank = sorted.findIndex(p => p.id === promptId) + 1;
    return {
      position: rank,
      total_prompts: sorted.length,
      percentile: rank > 0 ? Math.round((1 - rank / sorted.length) * 100) : 0
    };
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  initializeSession() {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      started_at: new Date().toISOString(),
      user_agent: navigator.userAgent || 'unknown',
      page_url: window.location?.href || 'unknown',
      prompt_executions: [],
      duration_ms: 0,
      ended_at: null
    };

    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    
    // Track session start
    if (!this.analytics.sessions[sessionId]) {
      this.analytics.sessions[sessionId] = session;
      this.analytics.global_stats.total_users++;
    }

    console.log(`📱 Started analytics session: ${sessionId}`);
    return session;
  }

  endSession() {
    const session = this.currentSession;
    if (!session) return;

    session.ended_at = new Date().toISOString();
    session.duration_ms = new Date(session.ended_at) - new Date(session.started_at);

    this.analytics.sessions[session.id] = session;
    this.saveAnalytics();

    console.log(`📱 Ended analytics session: ${session.id} (${session.duration_ms}ms)`);
  }

  // ============================================
  // STORAGE & PERSISTENCE
  // ============================================

  saveAnalytics() {
    try {
      this.analytics.last_analysis = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.analytics, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Failed to save analytics:', error);
      return false;
    }
  }

  exportAnalytics(promptId = null) {
    const exportData = {
      schema_version: this.analytics.schema_version,
      exported_at: new Date().toISOString(),
      global_stats: this.analytics.global_stats,
      prompts: promptId ? 
        { [promptId]: this.analytics.prompts[promptId] } : 
        this.analytics.prompts,
      summary: this.generateAnalyticsSummary()
    };

    return JSON.stringify(exportData, null, 2);
  }

  generateAnalyticsSummary() {
    const prompts = Object.values(this.analytics.prompts);
    
    return {
      total_prompts_tracked: prompts.length,
      total_executions: this.analytics.global_stats.total_executions,
      average_success_rate: prompts.length > 0 ? 
        prompts.reduce((sum, p) => sum + p.performance_metrics.success_rate, 0) / prompts.length : 0,
      most_used_prompt: prompts.reduce((max, p) => 
        p.performance_metrics.total_uses > (max?.performance_metrics?.total_uses || 0) ? p : max, null)?.id,
      active_ab_tests: Object.values(this.analytics.ab_tests).filter(t => t.status === 'active').length
    };
  }

  // ============================================
  // DATING APP SPECIFIC TEMPLATES
  // ============================================

  profileDiscovery(interests, preferences) {
    const templates = [
      `Based on your interests in ${interests.join(', ')}, what's one hobby that completely transforms your mood?`,
      `I see you're into ${interests[0]}. What drew you to that initially, and how has it shaped who you are?`,
      `Your interests tell a story about someone who values ${preferences.lifestyle}. What's one thing about yourself that would surprise someone meeting you for the first time?`
    ];

    return {
      template: templates[Math.floor(Math.random() * templates.length)],
      category: 'profile_discovery',
      metadata: { interests, preferences },
      prompt_id: 'profile_discovery_' + Date.now()
    };
  }

  conversationStarter(matchProfile, commonInterests = []) {
    const starters = [
      `I noticed we both love ${commonInterests[0] || 'exploring new things'}! What's your favorite discovery in that area recently?`,
      `Your profile caught my attention, especially the part about ${matchProfile.highlight || 'your passion for life'}. I'm curious - what's the story behind that?`,
      `We seem to have ${commonInterests.length || 'some interesting things'} in common! What's something you're passionate about that doesn't show up in your profile?`,
      `I love that you're into ${matchProfile.interest || 'living authentically'}. What's one thing that always makes you smile, no matter what kind of day you're having?`
    ];

    return {
      template: starters[Math.floor(Math.random() * starters.length)],
      category: 'conversation_starter',
      metadata: { matchProfile, commonInterests },
      prompt_id: 'conversation_starter_' + Date.now()
    };
  }

  reflectionGenerator(conversationHistory, context = {}) {
    const mood = context.mood || 'curious';
    const lastMessage = conversationHistory[conversationHistory.length - 1] || '';
    
    const templates = {
      positive: [
        "That sounds amazing! It seems like you really value that experience. What aspect of it resonates with you most?",
        "I love the energy in what you're sharing! How did that realization change your perspective?",
        "That's beautiful. I can sense how much that means to you. What drew you to that initially?"
      ],
      curious: [
        "I'm intrigued by what you said about that. Can you tell me more about how that shaped your perspective?",
        "That's fascinating. I'm curious - what's the story behind that belief or experience?",
        "I'd love to understand that better. What made that moment so significant for you?"
      ],
      supportive: [
        "I can hear that this is important to you. How has that experience influenced who you are today?",
        "Thank you for sharing that with me. What have you learned about yourself through that journey?",
        "I appreciate your openness about that. How do you carry that wisdom forward in your life?"
      ],
      deeper: [
        "That touches on something profound. How has your understanding of that evolved over time?",
        "There's something beautiful in what you're describing. What does that reveal about what you value most?",
        "I sense there's more beneath the surface here. What feels most important for me to understand about this?"
      ]
    };

    const moodTemplates = templates[mood] || templates.curious;
    const selectedTemplate = moodTemplates[Math.floor(Math.random() * moodTemplates.length)];

    return {
      template: selectedTemplate,
      category: 'reflection',
      metadata: { 
        mood, 
        conversationLength: conversationHistory.length,
        context: context 
      },
      prompt_id: 'reflection_' + Date.now()
    };
  }
}

// ============================================
// GLOBAL INITIALIZATION
// ============================================

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  window.PromptAnalyticsEngine = PromptAnalyticsEngine;
  window.promptAnalytics = new PromptAnalyticsEngine();
  
  // Auto-track page unload
  window.addEventListener('beforeunload', () => {
    if (window.promptAnalytics) {
      window.promptAnalytics.endSession();
    }
  });
  
  console.log('🚀 Prompt Analytics Engine ready for co-founder surprise!');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptAnalyticsEngine;
}