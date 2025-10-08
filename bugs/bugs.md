# 2025-10-07 22:28:46 IST

- **High – Loading fallback never clears** (`App.tsx:196`)
  - Once the five-second timeout flips `loadingTimeout` to true, the fallback screen stays even after auth resolves, leaving users stuck unless they refresh manually.
- **High – Demo matches crash the screen** (`src/screens/PixelPerfectMatchesScreen.tsx:24`)
  - The demo `compatibilityScore` objects omit required fields like `overallScore` and `breakdown`, so rendering hits `undefined` and throws before any match cards appear in demo mode.
- **High – Profile extraction throws** (`src/services/userProfileService.ts:113`)
  - The method references `commonLocations` instead of `this.commonLocations`, causing a `ReferenceError` when trying to derive a name from chat text and blocking automatic profile enrichment.
- **High – Matches never persist** (`src/services/matchingService.ts:430`)
  - `generateMatches` returns a fresh array but never stores it in `this.matches`, so subsequent reads/interactions see an empty cache and user actions (likes/passes) are lost.

# 2025-10-08 17:13:08 IST

- **High – Demo matches disappear** (`src/screens/PixelPerfectMatchesScreen.tsx:24,352`)
  - Seeded demo entries use `status: 'pending'` but the UI only renders `status === 'suggested'`, so demo mode always shows an empty list.
- **High – Matching profile id collision** (`src/services/matchingService.ts:101`)
  - Every generated profile/key is stored under the literal id `current_user`, causing different sign-ins to overwrite each other’s persona data and matches.
- **High – Feature flags default to false** (`src/config/environment.ts:50`)
  - `getBooleanEnvVar` ignores its fallback parameter; unset env vars return `'' ⇒ false`, disabling features meant to default to true (e.g., voice input).
- **High – Proxy URL resolves to localhost in production** (`src/services/chatAiService.ts:497-552`)
  - Without explicit `EXPO_PUBLIC_AI_PROXY_URL`, the app falls back to `http://127.0.0.1:3001/api/chat`, breaking AI calls on real deployments.
- **High – Demo Supabase stub lacks `.maybeSingle()`** (`src/services/supabase.ts:13`, `src/services/chatDatabase.ts:24`) 
  - The stub client used in demo mode doesn’t implement `.maybeSingle()`, so `chatDatabase.getOrCreateUser` throws and chat initialization fails as soon as demo mode is enabled.
- **High – Supabase client ignores demo mode toggles** (`src/services/supabase.ts:12`, `src/config/demo.ts:7`)
  - The Supabase client is created at module load using the initial `DEMO_MODE=false`; later calls to `setDemoMode(true)` don’t rebuild the client, so “demo” mode still hits the real backend with placeholder credentials and fails.
- **Medium – Chat subscriptions leak** (`src/screens/ChatScreen.tsx:31-73`, `src/services/supabase.production.ts:501`)
  - `ChatScreen` subscribes to message updates but never unsubscribes on unmount, so each visit stacks another listener and duplicate events.

# 2025-10-08 20:39:46 IST

- **High – Native chat crashes on window reference** (`src/components/SimpleReflectionChat.tsx:393,728`)
  - `initializeChat` and `handleSend` write to `window.*` without guarding for React Native; on iOS/Android `window` is undefined, so the first session initialization throws a ReferenceError and the chat never loads.
- **Medium – Saved photo messages lose images on reload** (`src/components/SimpleReflectionChat.tsx:338`, `src/services/chatDatabase.ts:120`)
  - Photo uploads store the URI in `chat_messages.metadata`, but when history is rehydrated the UI ignores `metadata.imageUri`, so reopening the app shows only the text placeholder and the shared image disappears.
