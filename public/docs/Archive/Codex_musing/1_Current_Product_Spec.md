# Current Product Spec

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
