# Codex Session Context Snapshot

- Timestamp: 2025-10-23T18:12:26Z
- Branch: restore-oct-9-to-19
- Commit: f46eef9 — feat: Beta launch preparation - security and stability

## Verified Fixes
- Realtime subscriptions enabled with de-dup (web/native ref Set)
- Phone normalization to +E.164 without hyphen rejection
- Profiles upsert with onConflict=phone_number
- Normalized DB lookups with legacy fallback + in-place update
- Message timestamps handled by DB defaults
- Auth gating before chat init
- Session manager initialized with profile UUID (not phone)
- Conversations rely on DB defaults for timestamps
- No redundant updated_at after message insert
- UI Message type includes metadata
- Demo stub includes channel/removeChannel and core chains (order/limit/in/delete)

## UX Notes / Next Improvements
- Demo stub: consider adding a no-op `.lt()` for pagination (used in history queries)
- Guard `window.*` usage in `handleSend` for native (use `Platform` check)
- Optional: ensure chat screen is reachable in navigation as desired
- Optional: implement native image picker (expo-image-picker) instead of placeholder

## How to Reload Next Time
Open this file or `tool-output/codex_session_context.json` and say:
“Load the saved Codex context and continue from here.”

