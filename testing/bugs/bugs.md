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

- **Medium – Demo Supabase stub ignores `.insert().select().single()`** (`src/services/supabase.ts:18`)
  - The in-memory Supabase stub used in demo mode returns a stub object without chaining, so calls like `.insert(...).select().single()` throw when `select` isn’t defined; demo flows that try to persist anything crash immediately.
- **High – Stream chat token call always fails in demo** (`src/services/streamChat.ts:52`, `src/services/supabase.ts:18`)
  - `StreamChatService.generateUserToken` calls `supabase.functions.invoke`, but the demo client stub returns `{ data: null }`, making the SDK throw because `data.token` is undefined.
- **High – Simple chat proxy URL doubles `/api/chat`** (`src/services/simpleChatService.ts:12`)
  - When `EXPO_PUBLIC_AI_PROXY_URL` already points to the chat endpoint, `resolveProxyUrl` blindly appends `/api/chat`, yielding URLs like `/api/chat/api/chat` and breaking the simple chat fallback.
- **High – Demo Supabase stub missing core query builders** (`src/services/supabase.ts:17-31`)
  - The in-memory stub only implements `select().eq().single()`; calls like `.order()`, `.limit()`, `.delete()`, or `.in()` (used throughout `chatDatabase`, `weeklyDigest`, etc.) explode in demo mode because the stub returns undefined for those methods.
- **Medium – Reflection longest streak increments on same-day entries** (`src/services/reflectionsRepository.ts:682-699`)
  - The SQL updates `longest_streak` with `current_streak + 1` even when the reflection happens on the same day, so logging twice in one day inflates the longest streak counter.
- **Medium – Image uploads never reach Claude on native** (`src/components/SimpleReflectionChat.tsx:635-655`)
  - The photo handler only encodes the file to base64 on web; on iOS/Android `base64Data` stays null, so the AI call never receives the image despite saving it locally.
