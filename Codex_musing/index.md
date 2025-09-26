<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  padding: 24px 20px;
  background: #f6f8fa;
  border-right: 1px solid #d0d7de;
  overflow-y: auto;
}
.sidebar h2 {
  margin-top: 0;
  font-size: 20px;
}
.sidebar a {
  display: block;
  text-decoration: none;
  color: #0969da;
  margin: 8px 0;
}
.sidebar a:hover {
  text-decoration: underline;
}
.content {
  margin-left: 300px;
  padding: 32px 40px;
  max-width: 960px;
}
@media (max-width: 960px) {
  .sidebar {
    position: relative;
    width: auto;
    border-right: none;
    border-bottom: 1px solid #d0d7de;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .sidebar a {
    margin: 0;
  }
  .content {
    margin-left: 0;
    padding: 24px;
  }
}
</style>

<div class="sidebar">
  <h2>Codex Musing</h2>
  <a href="#current-product-spec">1. Current Product Spec</a>
  <a href="#version-history">2. Version History</a>
  <a href="#product-vision">3. Product Vision & Roadmap</a>
  <a href="#archive-candidates">4. Archive Candidates</a>
  <a href="#functional-gaps">5. Functional Gaps & Fixes</a>
  <a href="#code-gaps">6. Code Gaps & Restructure</a>
</div>

<div class="content">
<section id="current-product-spec">
<h1>Current Product Spec</h1>

## Overview
- The running app is a React Native + Expo tab experience that renders the “PixelPerfect” screen family and wraps them with the feedback system (`App.tsx:19`, `App.tsx:67`, `App.tsx:144`).
- Demo mode is hard-coded: all data comes from local mocks and AsyncStorage instead of Supabase or live APIs (`src/config/demo.ts:1`, `src/contexts/AppStateContext.tsx:41`).
- Versioning is informational only: the header displays a computed `v1.2.2` badge based on a stored commit count, not on git (`src/components/VersionDisplay.tsx:17`).

## Primary Navigation
- Bottom tabs expose four surfaces: Home, Reflect, Matches, Profile, plus a heart icon that toggles a modal Messages overlay (`App.tsx:42`, `App.tsx:53`, `App.tsx:122`).

## Screen Experiences
- **Home feed:** Loads seeded reflections and streak numbers from AsyncStorage-backed services, and surfaces LinkedIn / YouTube / community prompts that only raise alerts (`src/screens/PixelPerfectHomeScreen.tsx:16`, `src/services/communityService.ts:58`, `src/services/habitTrackingService.ts:33`, `src/screens/PixelPerfectHomeScreen.tsx:58`).
- **Reflect chat:** Drives a simulated conversational loop. Voice transcription falls back to placeholder text unless an OpenAI key is provided (`src/components/ChatReflectionInterface.tsx:223`). User answers are stored locally, analyzed with heuristic text parsing, and generate scripted bot replies before picking the next prompt (`src/components/ChatReflectionInterface.tsx:445`, `src/components/ChatReflectionInterface.tsx:526`).
- **Matches:** Requires at least five stored reflections before generating a trio of mock matches from the local matching service; interactions update local state and show alerts with emoji feedback (`src/screens/PixelPerfectMatchesScreen.tsx:40`, `src/screens/PixelPerfectMatchesScreen.tsx:63`, `src/screens/PixelPerfectMatchesScreen.tsx:88`).
- **Profile:** Displays the cached personality profile assembled by `personalityInsightsService`, including static achievements and “unlock chats” copy (`src/screens/PixelPerfectProfileScreen.tsx:47`, `src/services/personalityInsightsService.ts:46`).
- **Messages overlay:** Renders static sample threads without real chat plumbing (`src/screens/PixelPerfectMessagesScreen.tsx:15`).

## Data & Service Layer
- Global state seeds eight reflection entries, hearts, and streak data at startup, then persists changes to AsyncStorage (`src/contexts/AppStateContext.tsx:41`, `src/contexts/AppStateContext.tsx:124`).
- Community feed, habit tracking, matching, personality evolution, notifications, and conversation memory services all run offline with deterministic sample data (`src/services/communityService.ts:58`, `src/services/habitTrackingService.ts:22`, `src/services/matchingService.ts:74`, `src/services/personalityEvolutionService.ts:20`, `src/services/conversationMemoryService.ts:18`).
- Supabase and API configs exist but are effectively inert because environment variables for URLs/keys default to empty strings and the app never calls the live services (`src/config/api.config.ts:3`, `src/services/supabase.service.ts:1`).

## Feedback & Instrumentation
- Every production screen is wrapped with `withSimpleFeedback`, enabling Cmd/Ctrl+Q to highlight elements and submit contextual feedback into the local SQLite database (`src/components/withSimpleFeedback.tsx:5`, `src/components/FeedbackSystem.tsx:33`, `src/services/feedbackDatabase.ts:15`).
- The management overlay (`src/screens/FeedbackManagementScreen.tsx:1`) provides filters, exports, and status updates entirely offline.

## Constraints & Observations
- Despite the design guideline of “no emojis” in the visual spec (`README.md:261`), the current UI still uses heart and emoji glyphs in tab icons and feedback copy (`App.tsx:73`, `src/screens/PixelPerfectMatchesScreen.tsx:88`).
- Voice, AI analysis, social integrations, and notifications are simulated; without wiring real keys or endpoints the app remains a polished single-user demo environment.
</section>

<section id="version-history">
<h1>Version History</h1>

Cupido’s repository only exposes partial git context, so the table below combines the documented commits with the custom backup log. Version numbers follow the commit-count scheme rendered in the header (`src/components/VersionDisplay.tsx:17`).

| Version | Reference | Commit Message / Comment | Notes |
| --- | --- | --- | --- |
| v1.0.0 | RESTORE_INSTRUCTIONS.md:167 | “Initial commit” (`f89be7a`) | Scaffolds the Expo project, baseline services, and documentation set. |
| v1.1.0 | version-history.log:1 | “Restored to App.full.tsx - clean navigation version” | Local backup capturing the pre–pixel-perfect navigation layer (`App.full.tsx`). |
| v1.1.1 | version-history.log:2 | “Before creating pixel-perfect UI replica” | Backup taken immediately prior to adopting the PixelPerfect screen family. |
| v1.1.2 | version-history.log:3 | “Before adding functionality to screens” | Backup preserved before wiring interactive props into the PixelPerfect views. |
| v1.2.1 | RESTORE_INSTRUCTIONS.md:4 | “Pixel-Perfect Design Implementation” (`a81a1cf`) | Introduces the current four-tab layout and PixelPerfect screens (`App.tsx:19`). |
| v1.2.2 | src/components/VersionDisplay.tsx:17 | (Commit message not recorded in repo) | Expands demo services and documentation; HEAD still depends on local mocks (`src/services/communityService.ts:58`). |

_There is no accessible history beyond these records; to recover additional metadata you would need to inspect the original git repository referenced in `RESTORE_INSTRUCTIONS.md`._
</section>

<section id="product-vision">
<h1>Product Vision &amp; Roadmap</h1>

## Mission and Vision
- The mission focuses on building “the world's most thoughtful platform for self-discovery and meaningful relationship formation through authentic conversation and AI-powered insights” (`PRODUCT_ROADMAP.md:6`).
- The vision extends to helping every person understand themselves deeply while finding a partner who values that authenticity (`PRODUCT_ROADMAP.md:8`).

## Claimed Current State (v1.2)
- Documentation asserts a conversational AI agent with ~967 questions, contextual follow-ups, and pure text interactions (`PRODUCT_ROADMAP.md:16`).
- Additional promises include voice and multimedia integration, real-time personality analytics, BJ Fogg/Hooked behavioral mechanics, and a complete minimalist design system (`PRODUCT_ROADMAP.md:26`, `PRODUCT_ROADMAP.md:44`, `PRODUCT_ROADMAP.md:50`).
- The PRD lists baseline metrics such as 25+ conversation exchanges and 40% voice usage (`PRODUCT_ROADMAP.md:57`), even though the active codebase still runs in demo mode (`src/config/demo.ts:1`).

## Strategic Pillars
- Depth-first matching, authenticity over attraction, AI-human partnership, and privacy-first controls are the four differentiators (`PRODUCT_ROADMAP.md:68`).
- Target personas span intentional daters, self-discovery seekers, and relationship-ready professionals (`PRODUCT_ROADMAP.md:96`).

## Behavioral Frameworks
- The deployment roadmap maps BJ Fogg’s Behavior Model into motivation, ability, and trigger plans, emphasizing micro-habits, smart defaults, and context-aware notifications (`DEPLOYMENT_ROADMAP.md:26`, `DEPLOYMENT_ROADMAP.md:48`, `DEPLOYMENT_ROADMAP.md:71`).
- Nir Eyal’s Hooked Model is applied across trigger → action → variable reward → investment loops, with emphasis on dynamic rewards and long-term reflection archives (`DEPLOYMENT_ROADMAP.md:97`, `DEPLOYMENT_ROADMAP.md:112`, `DEPLOYMENT_ROADMAP.md:141`).

## Near-Term Launch Plan
- A 90-day roadmap sequences foundation (Supabase, auth, reflection storage), engagement (habit loops, social features), and growth work (insights dashboards, mentorship) (`DEPLOYMENT_ROADMAP.md:231`).
- Monetization pivots to a freemium tier with a $9.99/month premium plan once behavioral hooks are in place (`DEPLOYMENT_ROADMAP.md:282`).

## Long-Term Vision
- Two- to five-year goals aim for global scale, predictive relationship coaching, therapy partnerships, and a research institute around human connection (`PRODUCT_ROADMAP.md:582`).
- Innovation themes include advanced AI conflict resolution, family support features, and professional certification programs (`PRODUCT_ROADMAP.md:604`).

## Reality Check Against the Build
- The current codebase is still a locally-seeded demo: Supabase keys are blank (`src/config/api.config.ts:3`), demo mode is hard-coded (`src/config/demo.ts:1`), and major flows like matching, chat, and notifications use heuristics rather than live services (`src/services/matchingService.ts:80`, `src/components/ChatReflectionInterface.tsx:223`, `src/services/notificationService.ts:1`).
- The roadmap remains a valuable guide for sequencing, but substantial engineering is required to bridge the gap between aspirational documentation and the implemented feature set.
</section>

<section id="archive-candidates">
<h1>Archive Candidates</h1>

Move the following assets into an `/archive` folder to reduce noise around the production build:

- `App.simple.tsx`: One-screen placeholder used to debug blank page issues; no longer wired into navigation (`App.simple.tsx:1`).
- `App.full.tsx`, `App.complex.tsx`, `App.mobile.tsx`, `App.debug.tsx`, `App.old.tsx`, `App.updated.tsx`: Alternative app shells superseded by the PixelPerfect entry point (`App.tsx:19`).
- `App.test.tsx`, `App.test-simple.tsx`, `App.backup.tsx`, `App.backup-20250724-112946.tsx` and the entire `backups/` directory: Historical snapshots preserved by the custom version-control script (`version-history.log:1`).
- `test-demo.js`, `test-debug.html`, `analyze-app.js`: One-off debugging utilities tied to the prior demo bootstrap; none are referenced by the current tooling.
- `src/services/matching.service.js`, `src/services/supabase.service.js`, `src/services/questionsService.ts`: Superseded service shells that duplicate the TypeScript implementations and risk drift (`src/services/matchingService.ts:1`).
- `src/services/demo/` mocks: Only needed when running the older demo flow described in `test-demo.js`; unused by the PixelPerfect screens.

Archiving these files keeps the root focused on the production-ready entry point while preserving history for reference.
</section>

<section id="functional-gaps">
<h1>Functional Gaps &amp; Fixes</h1>

| Gap | Evidence | Suggested Fix |
| --- | --- | --- |
| Demo-only data and no live backend | Demo mode forced on (`src/config/demo.ts:1`); Supabase client instantiated with empty URL/key (`src/services/supabase.service.ts:1`, `src/config/api.config.ts:3`). | Introduce environment-driven configuration, disable demo mode by default, and wire reflections, profiles, and matches to real Supabase tables. |
| Authentication flow bypassed | The main app mounts `AppStateProvider` instead of the Auth context, so onboarding screens never render (`App.tsx:144`, `src/navigation/AppNavigator.tsx:1`). | Restore an auth gate that checks session state before showing the tab navigator, and connect it to Supabase OTP/email flows. |
| Reflection “AI” is heuristics-based | Voice transcription returns a placeholder when no key is set (`src/components/ChatReflectionInterface.tsx:223`); follow-ups rely on keyword checks rather than AI responses (`src/components/ChatReflectionInterface.tsx:526`). | Move conversation logic into a service that calls OpenAI/Anthropic, handle errors gracefully, and persist prompts/responses server-side. |
| Matching relies on mock thresholds | Matches only generate after five local reflections and source entirely from sample data (`src/screens/PixelPerfectMatchesScreen.tsx:40`, `src/services/matchingService.ts:80`). | Replace the AsyncStorage implementation with real match queries, using stored personality traits and reflection embeddings once Supabase data is available. |
| Messages overlay is static | The modal prints hard-coded conversations with no data fetch (`src/screens/PixelPerfectMessagesScreen.tsx:15`). | Hook the overlay to a messaging service (Stream/Supabase real-time) and display actual threads or hide the entry point until messaging works. |
| Social connectors are cosmetic | LinkedIn/YouTube prompts only fire alerts (`src/screens/PixelPerfectHomeScreen.tsx:58`, `src/screens/PixelPerfectHomeScreen.tsx:92`). | Gate these CTAs behind real OAuth integrations or replace them with actionable setup tasks the app can honor today. |
| Design system conflicts | Design spec disallows emoji (`README.md:261`), yet tab icons, likes, and alerts use emoji hearts (`App.tsx:73`, `src/screens/PixelPerfectMatchesScreen.tsx:88`). | Swap emoji for typography or vector assets that align with the documented minimalist guidelines. |
</section>

<section id="code-gaps">
<h1>Code Gaps &amp; Restructure</h1>

| Issue | Evidence | Recommended Change |
| --- | --- | --- |
| Monolithic reflection component | `ChatReflectionInterface` exceeds 900 lines and mixes UI, audio, AI heuristics, storage, and analytics in one file (`src/components/ChatReflectionInterface.tsx:1`). | Split into hook modules (recording/transcription, question selection, response handling) and a presentational component; back each module with tests. |
| Duplicate service implementations | Legacy `.js` services sit alongside TypeScript versions (`src/services/matching.service.js`, `src/services/supabase.service.js`, `src/services/questionsService.ts`) creating drift risk. | Consolidate on the TypeScript files, delete or archive the JS copies, and expose services through an index barrel for dependency inversion. |
| Root cluttered with historical App shells | Multiple `App.*.tsx` variants remain even though the project only builds from `App.tsx` (`App.simple.tsx:1`, `App.full.tsx`, `App.updated.tsx`). | Move unused shells into `/archive/App/` or delete them after verifying git history, keeping the entry point obvious. |
| Hard-coded seed data scattered across contexts/services | Initial reflections, community feed, habit data, and personality traits are embedded in code (`src/contexts/AppStateContext.tsx:41`, `src/services/communityService.ts:58`, `src/services/personalityInsightsService.ts:46`). | Centralize demo seeds in JSON fixtures, load them through a seed helper, and replace them with real fetches in production mode. |
| Conflicting question loaders | Both `questionLoader` and `questionsLoader` read the same JSON with slight variations (`src/services/questionLoader.ts:1`, `src/services/questionsLoader.ts:1`). | Merge into a single typed question repository and expose consistent helpers for demo vs. production. |
| No automated tests or CI hooks | The repo ships without unit or integration tests for services or screens. | Introduce Jest/Vitest coverage for services (conversation memory, matching) and snapshot tests for PixelPerfect screens before onboarding backend work. |
| Feedback wrapper overrides every `onPress` prop | The feedback system re-clones children to insert handlers and highlight styles (`src/components/FeedbackSystem.tsx:120`), which risks masking genuine press events. | Refactor to use React portals or gestures that decorate components without mutating their props, ensuring production interactions remain pristine. |
| Configuration sprawl | API endpoints, feature flags, and demo constants are sprinkled across multiple files (`src/config/api.config.ts:3`, `src/config/demo.ts:1`). | Create a unified configuration module that pulls from environment variables and provides typed feature flags. |
</section>

</div>
