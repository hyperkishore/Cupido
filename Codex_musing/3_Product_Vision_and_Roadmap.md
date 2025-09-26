# Product Vision and Roadmap

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
