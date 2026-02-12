# Cupido Rebuild Plan - October 19, 2025

**Last Reset:** October 9, 2025 (commit 1e6eeac)
**Target:** Restore 10 days of lost development work

---

## ✅ Approved Permissions (40-Minute Autonomous Execution)

### File Operations
- ✅ Read all files in `/Users/kishore/Desktop/Claude-experiments/Cupido/`
- ✅ Write/Edit files in:
  - `src/services/`
  - `src/components/`
  - `src/database/migrations/`
  - `src/screens/`
  - `src/config/`
  - Root directory (server.js, package.json, etc.)
  - Public/docs
- ✅ Create new files as needed from stash

### Git Operations
- ✅ Create feature branch: `restore-oct-9-to-19`
- ✅ Git checkout files from stash: `git checkout stash@{0} -- <path>`
- ✅ Git add: `git add <files>`
- ✅ Git commit: `git commit -m "<message>"`
- ✅ Git status, diff, log
- ❌ NO git push to remote (will review before pushing)

### Bash Commands
- ✅ Run server: `node server.js`
- ✅ Run Expo: `npx expo start --clear --web`
- ✅ Install dependencies: `npm install <package>`
- ✅ Run test scripts: `node <script>.js`
- ✅ File operations: `ls`, `mkdir`, `cp`, `mv`, `chmod`
- ✅ Process management: `lsof`, `kill`, `pkill`

### Database Operations
- ✅ Execute migrations on Supabase via SQL Editor
- ✅ Query Supabase for validation
- ❌ NO destructive operations (DROP TABLE, TRUNCATE without backup)

### Testing
- ✅ Update comprehensive-test-functions.js
- ✅ Run tests in test dashboard iframe
- ✅ Validate functionality after each phase

### Commit Strategy
- ✅ Commit after each phase completion
- ✅ Use descriptive commit messages: "feat: <description>" or "fix: <description>"
- ✅ Include file counts and key changes in commit message

### Time Allocation
- **Total Time:** 40 minutes
- **Strategy:** Focus on Phase 1 (Foundation) first, then Phase 2 (Prompts)
- **Approach:** Move fast but validate each step

---

## 📊 Overview

**Total Changes:** 99 files modified, 18,553 lines added, 2,351 lines removed

**Backup Location:**
- Git Stash: `stash@{0}` - "Backup: Oct 19 state before reset to Oct 9"
- Git Branch: `backup-oct-19-before-reset`

---

## 🎯 Implementation Phases

### Phase 1: Foundation & Infrastructure (CRITICAL)
**Goal:** Get core services and database ready
**Estimated Time:** 2-3 hours

#### 1.1 Database Migrations
- [ ] **Migration 002**: Add profile fields (`src/database/migrations/002_add_profile_fields.sql`)
- [ ] **Migration 003**: Create prompts table with version control (`003_create_prompts_table.sql`)
- [ ] **Migration 004**: Import initial prompts (`004_import_prompts.sql`)
- [ ] **Migration 005a**: App versions table (`005_app_versions.sql`)
- [ ] **Migration 005b**: Add visibility control to prompts (`005_add_visibility_and_deprecate_active.sql`)
- [ ] **Migration**: Image attachments table (`add_image_attachments.sql`)

**Dependencies:** Supabase access, database backup recommended

---

#### 1.2 Core Services
- [ ] **promptRepository.ts** (406 lines)
  - Full CRUD for prompt versions
  - Git commit tracking
  - Version activation/deactivation
  - Export/import functionality

- [ ] **promptService.ts** (486 lines)
  - Caching with AsyncStorage
  - Polling for version changes (30s/60s intervals)
  - Prompt selection management
  - Real-time sync with Supabase

- [ ] **imageAnalysisService.ts** (175 lines)
  - Claude Vision API integration
  - Base64 image validation
  - Mood/theme extraction
  - Response generation

- [ ] **profileCompletenessService.ts** (250 lines)
  - Track profile building progress
  - Calculate completion percentage
  - Identify missing fields
  - Suggest next questions

- [ ] **apiResolver.ts** (75 lines)
  - Resolve API URLs for different environments
  - Handle localhost, LAN, production
  - Platform-specific resolution

**Dependencies:** Database migrations must be completed first

---

#### 1.3 Server Updates
- [ ] **server.js** (+1071 lines)
  - Reverse proxy for Expo dev server (`/app/*` → `localhost:8081`)
  - Prompt API endpoints (`/api/prompts`)
  - Test results endpoints (`/api/test-results`)
  - Image upload handling
  - CORS configuration
  - Environment validation

**Key Endpoints Added:**
```
GET  /api/prompts          - List all active prompts
POST /api/test-results     - Submit test results
GET  /api/test-results     - Get latest results
GET  /api/test-results/history - Get results history
```

**Dependencies:** None, can be done in parallel with migrations

---

### Phase 2: Prompt Management System (HIGH PRIORITY)
**Goal:** Restore prompt versioning and management UI
**Estimated Time:** 3-4 hours

#### 2.1 Prompt Data
- [ ] **prompts.json** - Updated with new prompt structure
- [ ] **custom-prompts.json** (20 lines) - Custom prompt variations
- [ ] **profile-building-prompts.json** (444 lines) - Profile-specific prompts
- [ ] **deleted-prompts.json** (10 lines) - Archived prompts

---

#### 2.2 Prompt UI Components
- [ ] **PromptSelectorModal.tsx** (311 lines)
  - Modal for switching between prompts
  - Filter by tags (cupido, simulator)
  - Show active version
  - Real-time updates when prompts change

**Features:**
- Dropdown selector
- Tag filtering
- Version display
- Refresh button
- Auto-dismiss on selection

---

#### 2.3 Prompt Management Scripts
- [ ] **import-prompts.js** (60 lines) - Import prompts from JSON to Supabase
- [ ] **import-profile-prompts.js** (115 lines) - Import profile building prompts
- [ ] **import-simulator-prompts.js** (182 lines) - Import simulator personas
- [ ] **tag-cupido-prompts.js** (113 lines) - Tag existing prompts
- [ ] **promptManager.js** (345 lines) - CLI tool for prompt operations
- [ ] **check-prompt-tokens.js** (25 lines) - Validate token counts
- [ ] **check-all-prompt-tokens.js** (75 lines) - Batch token validation
- [ ] **check-duplicates.js** (82 lines) - Find duplicate prompts

**Usage Example:**
```bash
# Import all prompts
node import-prompts.js

# Tag prompts for organization
node tag-cupido-prompts.js

# Check token counts
node check-all-prompt-tokens.js
```

---

#### 2.4 Integration with App
- [ ] **App.tsx** - Initialize promptService on mount
- [ ] **chatAiService.ts** - Load prompts from promptService instead of hardcoded
- [ ] **SimpleReflectionChat.tsx** - Add prompt selector UI

**Key Changes:**
```typescript
// App.tsx - Initialize prompt service
useEffect(() => {
  promptService.initialize();
  return () => promptService.stop();
}, []);

// chatAiService.ts - Use dynamic prompts
const promptId = await promptService.getSelectedPromptId();
const promptInfo = await promptService.getCurrentPromptInfo();
const systemPrompt = promptInfo.systemPrompt;
```

---

### Phase 3: Image Upload & Analysis (MEDIUM PRIORITY)
**Goal:** Enable image sharing in conversations
**Estimated Time:** 2-3 hours

#### 3.1 Database & Services
- [ ] **chatDatabase.ts** - Add image methods (+273 lines)
  - `saveImageAttachment()`
  - `getImageAttachments()`
  - `updateImageAnalysis()`
  - `getMessageImages()`

- [ ] **imageAnalysisService.ts** - Claude Vision integration

---

#### 3.2 UI Components
- [ ] **SimpleReflectionChat.tsx** - Image upload UI
  - Camera icon button
  - Image picker integration
  - Preview before sending
  - Display images in messages
  - Show AI analysis

**Libraries Needed:**
```bash
expo install expo-image-picker expo-camera expo-image-manipulator
```

---

#### 3.3 Testing
- [ ] **test-image-upload.html** (104 lines) - Standalone test page
- [ ] Image compression implementation
- [ ] Error handling for upload failures

---

### Phase 4: Profile Building System (MEDIUM PRIORITY)
**Goal:** Track and guide profile completion
**Estimated Time:** 2 hours

#### 4.1 Service Implementation
- [ ] **profileCompletenessService.ts**
  - Track required fields (name, age, location, work, interests)
  - Calculate completion percentage
  - Suggest next questions
  - Integration with chat flow

---

#### 4.2 Integration
- [ ] **chatAiService.ts** - Use profile context in prompts
- [ ] **userProfileService.ts** - Enhanced profile data storage (+158 lines)
- [ ] **PixelPerfectProfileScreen.tsx** - Profile display UI (+269 lines)

---

### Phase 5: Development Tools (LOW PRIORITY)
**Goal:** Improve developer experience
**Estimated Time:** 1-2 hours

#### 5.1 Shell Scripts
- [ ] **dev-init.sh** (76 lines) - One-command dev setup
- [ ] **dev-start.sh** (166 lines) - Environment starter with logging
- [ ] **health-check.sh** (143 lines) - System health validation

**Features:**
- Auto-install dependencies
- Kill conflicting processes
- Start server + Expo in one command
- Validate environment variables
- Check service health

---

#### 5.2 Utility Scripts
- [ ] **error-logger.js** (201 lines) - Centralized error logging
- [ ] **search-messages.js** (116 lines) - Search chat history

---

### Phase 6: Testing Infrastructure (LOW PRIORITY)
**Goal:** Comprehensive test coverage
**Estimated Time:** 2-3 hours

#### 6.1 Test Functions
- [ ] **comprehensive-test-functions.js** (+2380 lines)
  - Console error detection tests (5)
  - Message flow & UI tests (8)
  - Profile extraction tests (6)
  - Database operation tests (5)
  - Error handling tests (6)
  - State management tests (6)
  - API & performance tests (4)
  - **NEW:** Image upload tests (5)

---

#### 6.2 Test Dashboards
- [ ] **cupido-test-dashboard.html** - Enhanced dashboard (+23 lines)
- [ ] **test-dashboard.html** - Additional test runner (+45 lines)
- [ ] **test-simulator-flow.html** (374 lines) - Simulator testing
- [ ] **public/test-supabase.html** (75 lines) - Database connectivity test

---

#### 6.3 Test Scripts
- [ ] **test-user-creation.js** (235 lines) - User CRUD tests
- [ ] **test-prompt-creation.js** (129 lines) - Prompt version tests
- [ ] **test-email-auth.js** (109 lines) - Authentication flow tests
- [ ] **test-magic-link-mobile.js** (41 lines) - Magic link tests
- [ ] **test-html-parse.js** (35 lines) - Dashboard syntax validation

---

### Phase 7: Documentation (LOW PRIORITY)
**Goal:** Comprehensive documentation
**Estimated Time:** 1 hour

#### 7.1 Documentation Files
- [ ] **DEV-SCRIPTS.md** (212 lines) - Development workflow guide
- [ ] **IMAGE_FEATURE_IMPLEMENTATION.md** (711 lines) - Image feature docs
- [ ] **PROMPT_VERSION_SYSTEM.md** (325 lines) - Prompt versioning guide
- [ ] **PROMPT_SUPABASE_MIGRATION.md** (244 lines) - Migration guide
- [ ] **PROFILE_BUILDING_GUIDE.md** (506 lines) - Profile system docs
- [ ] **PROFILE_EXTRACTION_ARCHITECTURE.md** (773 lines) - Architecture overview
- [ ] **TWO_AI_ACTOR_IMPLEMENTATION.md** (268 lines) - Simulator system
- [ ] **SIMULATOR_FIXES_SUMMARY.md** (358 lines) - Simulator improvements
- [ ] **LIVE_PREVIEW_MIGRATION_PLAN.md** (1794 lines) - Preview system migration
- [ ] **QUICK_START.md** (187 lines) - Getting started guide
- [ ] **SIMPLE_SETUP.md** (214 lines) - Simplified setup
- [ ] **SIMPLE_DB_MIGRATION.sql** (68 lines) - Quick database setup
- [ ] **SUPABASE_RLS_FIX.sql** (92 lines) - RLS policy fixes

---

### Phase 8: Polish & Integration (FINAL)
**Goal:** Ensure everything works together
**Estimated Time:** 2-3 hours

#### 8.1 Component Updates
- [ ] **SimpleReflectionChat.tsx** (+1239 lines)
  - Simulator mode enhancements
  - Message queue (FIFO)
  - Image upload integration
  - Prompt selector integration
  - Enhanced error handling
  - Non-blocking sends with timeouts

- [ ] **VersionDisplay.tsx** (+95 lines)
  - Show current prompt version
  - Link to prompt management
  - Version freshness indicator

- [ ] **MinimalChatInput.tsx** (+26 lines)
  - Image upload button
  - Preview support

---

#### 8.2 Context & Auth Updates
- [ ] **AuthContext.tsx** (+39 lines)
  - Magic link handling
  - Session recovery
  - Error states

- [ ] **AppModeContext.tsx** (+15 lines)
  - Mode switching improvements

---

#### 8.3 Screen Updates
- [ ] **LoginScreen.tsx** (+209 lines)
  - Magic link UI
  - Error handling
  - Loading states

- [ ] **PixelPerfectMatchesScreen.tsx** (+84 lines)
- [ ] **PixelPerfectProfileScreen.tsx** (+269 lines)
- [ ] **PixelPerfectReflectScreen.tsx** (+4 lines)

---

#### 8.4 Configuration
- [ ] **.eslintrc.js** - Add react-native plugin
- [ ] **.gitignore** - Add logs directory
- [ ] **app.json** - Version updates
- [ ] **package.json** - New dependencies

**New Dependencies:**
```json
{
  "expo-image-picker": "~14.x.x",
  "expo-camera": "~13.x.x",
  "expo-image-manipulator": "~11.x.x"
}
```

---

## 📋 Implementation Checklist

### Before Starting
- [ ] Verify current codebase is at Oct 9th commit (1e6eeac)
- [ ] Backup current database
- [ ] Create feature branch: `git checkout -b restore-oct-9-to-19`
- [ ] Review stashed changes: `git stash show -p stash@{0}`

---

### Phase-by-Phase Execution

#### Phase 1 (Foundation) - Start Here
1. [ ] Run all database migrations in order
2. [ ] Verify migrations in Supabase dashboard
3. [ ] Add core services (promptRepository, promptService, imageAnalysisService, profileCompletenessService, apiResolver)
4. [ ] Update server.js with new endpoints
5. [ ] Test server starts successfully
6. [ ] Test database connections work

**Validation:**
```bash
# Check server
curl http://localhost:3001/api/prompts

# Check database
psql [your-connection-string] -c "SELECT * FROM prompt_versions LIMIT 1;"
```

---

#### Phase 2 (Prompts) - Second Priority
1. [ ] Add prompt JSON files
2. [ ] Run import scripts
3. [ ] Add PromptSelectorModal component
4. [ ] Update App.tsx to initialize promptService
5. [ ] Update chatAiService to use dynamic prompts
6. [ ] Test prompt switching in UI

**Validation:**
```bash
# Import prompts
node import-prompts.js

# Check prompts imported
curl http://localhost:3001/api/prompts

# Test in app
# Open app → Settings → Switch Prompt → Should see multiple options
```

---

#### Phase 3 (Images) - Third Priority
1. [ ] Run image migration
2. [ ] Add imageAnalysisService
3. [ ] Update chatDatabase with image methods
4. [ ] Install expo image dependencies
5. [ ] Add image upload UI to SimpleReflectionChat
6. [ ] Test image upload and analysis

**Validation:**
```bash
# Install dependencies
expo install expo-image-picker expo-camera expo-image-manipulator

# Test in app
# Open chat → Click camera icon → Upload image → Should see AI analysis
```

---

#### Phase 4 (Profile) - Fourth Priority
1. [ ] Add profileCompletenessService
2. [ ] Update userProfileService
3. [ ] Update profile screens
4. [ ] Test profile tracking

---

#### Phase 5 (Dev Tools) - As Needed
1. [ ] Add shell scripts (dev-init.sh, health-check.sh)
2. [ ] Make executable: `chmod +x *.sh`
3. [ ] Test: `./dev-init.sh`

---

#### Phase 6 (Testing) - Parallel with Other Phases
1. [ ] Update comprehensive-test-functions.js
2. [ ] Add new test HTML pages
3. [ ] Run tests to validate each phase

---

#### Phase 7 (Docs) - Last
1. [ ] Copy all markdown files
2. [ ] Serve docs at `/docs` endpoint
3. [ ] Verify all links work

---

#### Phase 8 (Polish) - Final
1. [ ] Update all components with enhancements
2. [ ] Update configuration files
3. [ ] Full integration test
4. [ ] Performance check

---

## 🚨 Critical Issues to Watch

### Issue 1: Prompt Caching
**What:** Anthropic Prompt Caching is already implemented in server.js
**Impact:** Must maintain this when updating server
**Location:** `server.js` lines 137-230

---

### Issue 2: Message Type Mismatch
**What:** Dashboard sends 'simulator-message', app expects 'SIMULATOR_MESSAGE'
**Impact:** Simulator won't work until fixed
**Files:** `cupido-test-dashboard.html`, `SimpleReflectionChat.tsx`

---

### Issue 3: Database Constraint Violations
**What:** prompt_versions table has strict constraints (one active version per prompt)
**Impact:** Must activate new versions correctly
**Solution:** Use `activateVersion()` method from promptRepository

---

### Issue 4: Image Size Limits
**What:** 10MB limit for images, but no compression yet
**Impact:** Large images will fail upload
**Solution:** Implement compression before upload (Phase 3)

---

### Issue 5: Rate Limiting
**What:** No rate limiting on API endpoints
**Impact:** Potential abuse, high costs
**Solution:** Add rate limiting in server.js (future task)

---

## 🔄 Recovery from Stash

If you need to quickly recover specific files:

```bash
# List stashed files
git stash show stash@{0} --name-only

# Recover specific file
git checkout stash@{0} -- path/to/file

# Recover everything (CAREFUL!)
git stash pop stash@{0}
```

---

## 📊 Progress Tracking

### Overall Progress
- [ ] Phase 1: Foundation (0/6 tasks)
- [ ] Phase 2: Prompts (0/4 tasks)
- [ ] Phase 3: Images (0/3 tasks)
- [ ] Phase 4: Profile (0/2 tasks)
- [ ] Phase 5: Dev Tools (0/2 tasks)
- [ ] Phase 6: Testing (0/3 tasks)
- [ ] Phase 7: Documentation (0/1 tasks)
- [ ] Phase 8: Polish (0/4 tasks)

**Total:** 0/25 major tasks completed

---

## 📝 Notes & Decisions

### Decision Log
- **2025-10-19:** Reset to Oct 9 to start clean rebuild
- **2025-10-19:** Created comprehensive rebuild plan
- _(Add decisions as you make them)_

### Open Questions
- Should we implement image compression immediately or defer to V2?
- Do we need all test files or just critical ones?
- Should prompt management UI be in-app or dashboard-only?

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- [ ] All 6 migrations run successfully
- [ ] All 5 core services compile without errors
- [ ] Server starts and responds to `/api/prompts`
- [ ] Database queries work from app

### Phase 2 Complete When:
- [ ] At least 3 prompts imported to database
- [ ] Prompt selector shows in UI
- [ ] Can switch between prompts
- [ ] Chat uses selected prompt

### Phase 3 Complete When:
- [ ] Can upload an image from chat
- [ ] Claude analyzes the image
- [ ] Analysis displays in chat
- [ ] Image stored in database

### Phase 4 Complete When:
- [ ] Profile completion shows in UI
- [ ] Missing fields identified correctly
- [ ] Profile data persists

### All Phases Complete When:
- [ ] All features from Oct 9-19 restored
- [ ] All tests passing
- [ ] No console errors
- [ ] Documentation up to date
- [ ] Ready to commit and continue development

---

## 📞 Support

If you get stuck:
1. Check the specific implementation file in the stash
2. Review relevant documentation (Phase 7 files)
3. Test individual components in isolation
4. Use health-check.sh to diagnose issues

---

**Created:** October 19, 2025
**Last Updated:** October 19, 2025
**Status:** Ready to begin Phase 1
