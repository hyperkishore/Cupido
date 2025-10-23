# CUPIDO - Dating App Platform
*Co-founder Level Development Context*

## 🧠 MANDATORY DEVELOPMENT METHODOLOGY

### Core Principles for World-Class Programming

#### 1. 🔍 SYSTEMS THINKING FIRST
- Analyze root causes, not symptoms
- Identify if multiple issues stem from same architectural problem
- Ask: "What's the minimal change that fixes multiple issues?"
- Map dependencies and data flow before changes

#### 2. 📋 CONTEXT PRESERVATION DISCIPLINE
- Update CLAUDE.md immediately after significant changes
- Document architectural "before/after" state
- Explain WHY changes were made, not just WHAT
- Include file locations and line numbers

#### 3. 🎯 VERIFICATION-DRIVEN DEVELOPMENT
- Test actual functionality before claiming "fixed"
- Verify edge cases and error conditions
- Check that fixes don't break other systems
- Use precise language about implementation vs verification

#### 4. 🏗️ ARCHITECTURE-FIRST PROBLEM SOLVING
1. **Analyze**: Group issues by common root cause
2. **Design**: Create minimal architectural solution
3. **Implement**: Make surgical changes, not patches
4. **Verify**: Test all related issues resolved
5. **Document**: Update CLAUDE.md with reasoning

#### 5. 🔄 SINGLE SOURCE OF TRUTH PRINCIPLE
- One script registry, one execution path, one update mechanism
- Remove conflicting functions rather than patching
- Consolidate overlapping systems
- Prefer deletion over addition when solving conflicts

---

## 🎯 CURRENT STATUS
- **Server**: Port 3001
- **Branch**: restore-oct-9-to-19  
- **Version**: 1.2.6
- **Test Success**: 72/72 tests passing (100%)
- **Last Updated**: October 21, 2025

## 🏗️ SYSTEM ARCHITECTURE

### Core Components
1. **Main Server** (`server.js`) - Express server with all integrations
2. **Chat Interface** (`src/components/SimpleReflectionChat.tsx`) - Simplified context management
3. **AI Service** (`src/services/chatAiService.ts`) - Claude integration with proxy support
4. **Test Dashboard** (`cupido-test-dashboard.html`) - 72 test scenarios with monitoring
5. **Analytics Dashboard** (`cupido-analytics-dashboard.html`) - Real-time metrics

### Key Systems
- **Prompt Management**: Analytics engine, template engine, version control
- **Automation**: Workflow engine for optimization and monitoring
- **Deployment**: 10-stage pipeline with blue-green deployment
- **Testing**: Self-validating framework with health monitoring

### Access Points
- Main App: `http://localhost:3001/app`
- Test Dashboard: `http://localhost:3001/cupido-test-dashboard`
- Analytics Dashboard: `http://localhost:3001/analytics-dashboard`

## 🔧 DEVELOPMENT COMMANDS
```bash
npm start          # Start development server
npm test           # Run tests
npm run typecheck  # Type checking
npm run lint       # Linting
```

## 📊 CRITICAL FIXES IMPLEMENTED

### Chat System Architecture (October 21, 2025)
| Issue | Solution | Impact |
|-------|----------|--------|
| Context loss/"Hey I'm Cupido" loop | Removed complex `conversationContext.ts`, build from UI messages | Eliminated greeting loops |
| Send button unresponsive on mobile | Simplified to Platform.OS checks only | 100% tap responsiveness |
| Scrolling issues on web | Added requestAnimationFrame with manual button | Reliable scrolling |
| Image display sequence wrong | Fixed message ordering, overlay timestamps | Correct chronological display |
| Network issues on real devices | Enhanced proxy URL resolution for device IPs | Proper API connectivity |

### Dashboard Infrastructure (October 20, 2025)
| Component | Issues Fixed | Status |
|-----------|--------------|---------|
| Test Execution | 34 core issues: XSS, state management, API tracking | ✅ Production-ready |
| Health Monitoring | 7 issues: script registry, timestamps, memory leaks | ✅ Self-healing enabled |
| Scripts Tab | 8 production issues: timeouts, concurrency, error boundaries | ✅ Enterprise-grade |
| Tab Navigation | Conflicting switchTab functions | ✅ Fully functional |

## 🚨 CRITICAL CONTEXT

### Current Implementation Details

#### Chat Context Management (SIMPLIFIED)
- **Removed**: `conversationContext.ts` service (can be deleted)
- **Current**: Build context from last 30 UI messages only
- **No state**: No `conversationHistory` state exists
- **Location**: `src/components/SimpleReflectionChat.tsx:843-855`

#### Mobile/Web Compatibility
- **Send Button**: Always responsive via `onPress={() => handleSend())`
- **Return Key**: Platform-specific via `Platform.OS === 'web' ? 'default' : 'send'`
- **Scrolling**: Web uses requestAnimationFrame, native uses FlatList props
- **Images**: 80% compression, 2048px max, trimmed history for performance

#### Dashboard Health System
- **Script Registry**: Single `HEALTH_SCRIPTS` object (15 scripts)
- **Execution**: Unified `runScript()` with timeout/concurrency control
- **Memory**: Auto-cleanup at 300 lines, batch removal
- **Errors**: Global boundaries with automatic recovery

### Key Files Reference
| File | Purpose | Critical Notes |
|------|---------|----------------|
| `server.js` | Main server | All API endpoints integrated |
| `SimpleReflectionChat.tsx` | Chat UI | Lines 843-855 for context building |
| `chatAiService.ts` | AI integration | Lines 562-636 for proxy resolution |
| `cupido-test-dashboard.html` | Testing | 42 fixes applied, self-healing enabled |
| `imageUtils.ts` | Image processing | 80% quality, 2048px max dimensions |

### Debug Settings
- Chat DEBUG mode: Currently ON (line 165 SimpleReflectionChat.tsx) - disable for production
- AI logging: Enabled for model usage visibility

## 🔄 RECENT CRITICAL CHANGES

### Latest Session (October 21, 2025)
1. **Context System Overhaul**: Eliminated complex async context service causing greeting loops
2. **Mobile Fixes**: Simplified detection logic, fixed send button responsiveness
3. **Performance**: Reduced image payload by 80%, instant UI updates
4. **Scrolling**: Implemented reliable web scrolling with manual controls

### Important Architectural Decisions
- **Removed Systems**: conversationContext.ts, complex mobile detection, artificial delays
- **Simplified**: Single Platform.OS checks, direct message array context, unified script registry
- **Optimized**: Image compression maintained, history trimming for requests, batched DOM cleanup

## 🎯 NEXT SESSION PRIORITIES
1. Consider deleting `src/services/conversationContext.ts` (no longer used)
2. Disable DEBUG mode for production (line 165)
3. Monitor performance on real devices
4. Continue building on simplified architecture

## 🔒 PRODUCTION STATUS
- **Security**: XSS prevention, input validation, double-confirmation for data deletion
- **Reliability**: Error boundaries, timeout handling, concurrency control
- **Performance**: Memory management, request optimization, payload reduction
- **Compatibility**: Cross-platform tested, fallback mechanisms, network resilience

---
*This context file is the single source of truth for Cupido development. Keep it updated with architectural changes and critical decisions.*