# Cupido Product Guide

This guide captures the current product vision, the experience that already exists, planned investments, and the journey that brought Cupido to its present shape. It replaces the previous multi-file product documentation set.

## Product Vision & Positioning

- **Mission**: Give people the world's most thoughtful space for self-discovery and relationship-building, using AI to deepen conversations rather than replace them.
- **Vision**: Every person should understand their authentic self and meet a partner who appreciates that depth while they both continue to grow.
- **Value Pillars**
  - *Depth-first conversations*: The app prioritises reflective dialogue over swiping mechanics.
  - *Authenticity before attraction*: Identities reveal gradually as trust and insight accumulate.
  - *AI as a companion*: The assistant guides, remembers, and celebrates progress without removing human agency.
  - *Privacy-first architecture*: Local-first storage with optional cloud sync keeps sensitive reflections under user control.
- **Primary Personas**
  - Intentional daters in their late 20s who want long-term alignment, not casual matches.
  - Self-discovery seekers who may be single or partnered but value guided reflection.
  - Relationship-ready professionals who want efficient yet meaningful matchmaking supported by evidence-based insights.

## Current Product Experience (October 2025)

### Core Journeys
- **Onboarding & Access**: Phone-based login backed by local storage; demo mode bypasses auth for quick tours (UI still highlights pending tweaks around the demo toggle).
- **Daily Reflection Chat**: `SimpleReflectionChat` powers a natural conversation loop with curated prompts, AI follow-ups, typing indicators, voice input stubs, and persistence via the reflections repository.
- **Matches & Compatibility**: Pixel-perfect matches view highlights demo matches now; the underlying matching service synthesises personality traits, conversation memory, and compatibility reasoning for forthcoming real profiles.
- **Profile & Insights**: The profile tab surfaces authenticity scores, traits, milestones, logout/delete workflows, and guardrails for demo/local modes.
- **Home Dashboard**: Aggregates streaks, trending tags, community spotlights, and recommended prompts through `homeExperienceService`.

### Experience Enablers
- **Gamification**: Streaks, points, authenticity scoring, and milestone copy already land in the UI even while some back-end hooks remain local-first.
- **Analytics & Memory**: `personalityInsightsService` and `conversationMemoryService` maintain trait deltas, topics, and emotional fingerprints to personalise future prompts and matches.
- **Community & Feedback**: The home feed and feedback system allow in-product QA toggles, data capture, and community reflection hearts that influence personality graphs.

### Known Gaps to Address
- Multi-user isolation for chat data (all users currently share the same Supabase session).
- Demo mode onboarding polish (login screen copy and default flow).
- Advanced media sharing (voice, rich photos) behind planned services.
- Push notifications and background sync still on the roadmap.

## Product Roadmap

### Near-Term Focus (Phase 1 - Enhanced Memory & Basic Matching)
- Persistent cross-session memory referencing prior reflections.
- Dynamic personality visualisation with milestone celebrations.
- Context-aware prompt selection that avoids repetition.
- Compatibility scoring that blends personality, values, and communication signals.
- Anonymous profile cards with clear compatibility explanations and gradual reveal.

### Mid-Term Investments (Phase 2 - Deep Intelligence & Advanced Matching)
- Emotional state recognition and adaptive coaching tone.
- Communication style and attachment pattern detection to enrich insights.
- Love language and conflict-pattern mapping for richer compatibility.
- Advanced matching presentation with cinematic storytelling of "why" two people fit.

### Longer-Term Horizon (Phase 3 and Beyond)
- In-app experiences: anonymous reveals, shared rituals, community reflection rooms.
- Monetisation adjacencies: premium discovery paths, concierge coaching, retreats.
- Platform extensions: weekly digests, exportable insights, integrations with calendars or journaling tools.
- Trust & safety enhancements: verification, proactive moderation dashboards, emergency tooling.

## Operational Considerations

- **Success Metrics**: Conversation depth (currently ~25 exchanges/session), match acceptance rate, authenticity score growth, and retention of streaks.
- **Compliance & Safety**: Path to full launch includes identity verification, moderation queues, RLS-backed data policies, and clear offboarding workflows.
- **Developer Workflow**: Expo-based delivery (`npm start`, `npm run web/ios`), lint/type/test gates, and Supabase migrations underpin the build.
- **Documentation & Enablement**: Technical guide (`code.md`) details architecture; this document should be updated whenever roadmap or positioning shifts.

## Product History & Evolution

1. **Prototype Foundations** - Early "Simple" and "Functional" screen variants validated the reflective chat experience, question pacing, and basic navigation.
2. **Design System Shift** - The PixelPerfect series introduced the Apple/Airbnb visual language, consolidated navigation, and wrapped every screen in QA tooling.
3. **AI & Insight Expansion** - Personality, conversation memory, and matching services matured to translate reflections into compatibility logic and growth insights.
4. **Production Hardening** - Supabase-backed services, schema v2, and advanced documentation aligned the app for deployment, culminating in the Oct 2025 refresh that simplified demos, clarified architecture, and focused the docs into code/product guides.

_Last updated: 2025-10-05_
