# Cupido Code Guide

This document explains how the Expo/React Native codebase is structured, how data moves through the app, and where to extend or integrate new features. It replaces the older multi-file code documentation.

## Runtime Overview

- **Target platforms**: Expo (iOS/Android) with a React Native Web build for browsers.
- **Entry point**: `App.tsx` wires providers and the bottom-tab experience (`Home`, `Reflect`, `Matches`, `Profile`).
- **Providers**: `ModeProvider` → `AuthProvider` → `AppStateProvider` → `FeedbackProvider` wrap `Root`, which decides between login, demo mode, or the signed-in shell.
- **Modes**: `AppModeContext` toggles between `demo` (pre-seeded data, no auth) and `local` (phone-based login persisted locally). The setting persists via AsyncStorage and also drives demo-specific service behaviour.

## Navigation & Shell

- `App.tsx` hosts a tab navigator with pixel-perfect screens and an inline messages drawer:
  - `PixelPerfectHomeScreen` – reflection feed, stats, community spotlights.
  - `PixelPerfectReflectScreen` – chat-style reflection capture powered by `SimpleReflectionChat`.
  - `PixelPerfectMatchesScreen` – compatibility insights sourced from `matchingService`.
  - `PixelPerfectProfileScreen` – personality insights and account management.
  - `PixelPerfectMessagesScreen` renders full-screen when the header icon is used.
- Legacy navigators live in `src/navigation/AppNavigator.tsx` for alternative screen sets but are not mounted in the current shell.

## State & Context Providers

All global state is lifted into context providers under `src/contexts/`:

- `AppModeContext` (`ModeProvider`, `useAppMode`) stores the current mode and updates `DEMO_MODE` (`src/config/demo.ts`).
- `AuthContext` handles pseudo-authentication with `AuthService`. In demo mode it delegates to mocks, otherwise to the local user repository.
- `AppStateContext` keeps reflection answers, stats, and progress in a reducer. It hydrates from `reflectionsRepository`, writes back on mutations, and exports helpers like `generateId`.
- `FeedbackContext` toggles in-app QA tooling (keyboard shortcut `Cmd/Ctrl + Q` on web) and preps the feedback database.
- `ChatContext` (currently stubbed with `StreamChatService`) is ready for real-time chat integration; demo mode short-circuits the connection.

## Persistence Layer

The app prefers SQLite on native builds and falls back to in-memory stores or AsyncStorage on web:

- `src/database/client.ts` exposes `getDatabase`, returning a Web mock or an Expo SQLite instance.
- `src/database/schema.ts` creates local tables for user reflections, community reflections, prompts, and stats.
- `reflectionsRepository.ts` orchestrates all reflection data:
  - Seeds from `src/data/sampleReflections.ts` when the DB is empty or unavailable.
  - Provides CRUD helpers (`listUserReflections`, `createUserReflection`, `toggleUserReflectionLike`, `listCommunityReflections`, `getStats`, etc.).
  - Maintains an in-memory fallback that keeps the demo running without SQLite.
- `userContextService` stores the current user identifier (normalized phone number) so repositories can segment per user.
- `LocalUserRepository` persists users with AsyncStorage on web and SQLite on device.

### Supabase Integration (Optional)

- `supabase.ts` builds a real client when environment keys exist, otherwise returns a demo shim that no-ops requests.
- `chatDatabase.ts` uses Supabase tables (`profiles`, `chat_conversations`, `chat_messages`) to persist chat history. In demo mode these calls resolve but do not modify remote state.

## Reflection & Conversation Flow

1. The `PixelPerfectHomeScreen` loads `HomeExperienceData` from `homeExperienceService`, which aggregates:
   - Reflection stats, trending tags, and latest answers (via `reflectionsRepository`).
   - Community reflections (same repository) with optimistic like toggles.
   - Daily intention heuristics based on recent insights.
2. `PixelPerfectReflectScreen` embeds `SimpleReflectionChat` for the guided conversation experience:
   - Initializes profile data (`userProfileService`) and chat sessions (`chatDatabase`).
   - Pulls natural prompts and fallback scripts defined in the component.
   - `chatAiService` broker calls to the Anthropic proxy endpoint using prompt templates in `src/config/prompts.json`.
   - Messages are stored locally and optionally synced to Supabase via `chatDatabase`.
   - The service layer exposes `conversationMemoryService` and `personalityInsightsService` for deeper tracking (see `src/components/ChatReflectionInterface.tsx`), though the PixelPerfect flow currently focuses on persisted chat transcripts and persona updates.
3. Completing a reflection dispatches `ADD_ANSWER` through `AppStateContext`, which persists via `reflectionsRepository` and updates stats (`UPDATE_STATS`).

## Matching & Persona Insights

- `matchingService.ts` synthesizes compatibility data. It composes
  - Personality traits from `personalityInsightsService`.
  - Conversation patterns from `conversationMemoryService`.
  - AsyncStorage-backed history of generated matches and interactions.
- In demo mode `PixelPerfectMatchesScreen` swaps in scripted matches. In local mode it calls `matchingService.initialize()` and `generateMatches()` to produce structured `Match` objects (including strengths, challenges, and match types).
- `personalityInsightsService.ts` keeps a local trait profile, auto-updating percentages and insights per reflection, and exposes the view consumed by the profile screen.
- `conversationMemoryService.ts` indexes every answered prompt (topics, emotion scores, milestones). Matching and digest features use this memory to personalize experiences.

## Feedback & Instrumentation

- `FeedbackProvider` enables QA overlays and keyboard toggles for exploratory testing.
- `withSimpleFeedback`/`FeedbackWrapper` wrap screens to open lightweight capture modals.
- `feedbackDatabase.ts` provisions a dedicated SQLite DB (`cupido_feedback.db`) for structured feedback, attachments, and comments. A lightweight web fallback lives in `feedbackDatabase.web.ts`.
- `FeedbackManagementScreen.tsx` and overlay components render stored feedback for review.

## UI Components & Design System

- Pixel-perfect screens rely on shared components under `src/components/` (e.g., `SimpleReflectionChat`, `VersionDisplay`, `FeedbackOverlay`).
- Voice input utilities (`useVoiceRecording`, `CleanVoiceInput`) gracefully degrade in demo mode by skipping Expo audio APIs.
- `src/design-system/tokens.ts` defines the canonical color, type, spacing, and shadow tokens. `src/utils/theme.ts` contains a simplified palette used by legacy screens.

## Configuration & Environment

- `src/config/environment.ts` centralizes environment variables, feature flags, and helper utilities (`isDevelopment`, `getApiUrl`).
- `src/config/api.config.ts` lists REST endpoints targeted by higher-level services. Most routes are placeholders until the production backend is wired up.
- Feature flags (voice input, AI matching, analytics, etc.) default to enabled for demos but can be toggled by Expo `EXPO_PUBLIC_*` vars.

## Testing & Tooling

- Unit tests live in `tests/` (Node-based suites). Run `npm run test:unit` for coverage.
- Linting (`npm run lint`) and type-checking (`npm run type-check`) must stay green before commits.
- Development commands: `npm run start` (Expo), `npm run web`, `npm run ios`, and `npm run build:production` for deployment bundles.

## Directory Reference

```
App.tsx                      – entry point and tab navigator
src/contexts/                – global state providers (mode, auth, app state, feedback, chat)
src/services/                – domain services (reflections, chat AI, matching, persona, storage)
src/database/                – SQLite client and schema definitions
src/components/              – reusable UI primitives and complex widgets
src/screens/                 – Pixel-perfect experience plus alternative prototypes
src/config/                  – environment config, demo mode toggles, prompts
src/data/                    – sample reflections, prompt seeds, mock datasets
src/utils/                   – theme, error handling, PWA hooks
```

## Extending the Codebase

1. Initialize the appropriate context or service before using it (e.g., `personalityInsightsService.initialize()` in new screens).
2. For persistence, prefer repository helpers instead of writing SQL directly—repositories already handle SQLite vs. web fallbacks.
3. When adding networked features, gate behaviour on `DEMO_MODE` to keep the demo flow stable without backend access.
4. Wrap new top-level screens with `withSimpleFeedback` so QA tools remain consistent.
5. Document any new modules by updating this file rather than introducing additional markdown files.

---

_Last updated: 2025-10-05_
