# Repository Guidelines

Cupido is an Expo-driven React Native app. This guide orients code reviewers and architecture planners.

## Agent Role: Review & Architecture Planning
- Operate as a code reviewer and expert architect.
- Do not modify repository files or create commits; provide suggestions, rationales, and phased plans.
- Reference concrete paths and lines in feedback (e.g., `src/services/foo.ts:42`).
- Prefer structured outputs: review checklists, RFC-style proposals, and roadmaps.

## Project Structure & Module Organization
- Source in `src/`: `components/`, `screens/`, `services/`, `contexts/`.
- Shared in `src/utils/` and `src/types/`.
- Assets/mock data in `assets/` and `data/`.
- Automation in `scripts/`; examples/manual flows in `design_examples/` and `MANUAL_TEST_INSTRUCTIONS.md`.
- Web build output in `dist/`.
- Integration entry points: `index.ts`, `server.js`.

## Build, Test, and Development Commands
- Install deps: `npm install`.
- Start dev server: `npm run start` (Expo). Targets: `npm run web`, `npm run ios`.
- Build web bundle: `npm run build` or `npm run build:production` (outputs to `dist/`).
- Lint: `npm run lint` (ESLint across TypeScript sources).
- Type check: `npm run type-check` (`tsc --noEmit`).
- Unit tests: `npm run test:unit` (Node-based service tests in `tests/`).

## Review Criteria: Style & Naming
- TypeScript + functional React; 2-space indent, single quotes, trailing commas on multiline.
- Names: Components/Screens `PascalCase`; hooks `useCamelCase`; helpers `camelCase`.
- Prefer co-located styles via `StyleSheet.create` unless shared.

## Testing Guidelines (for review)
- Unit tests in `tests/`; custom mocks in `tests/setup/`.
- Test files named `<feature>.test.js`.
- Expect coverage for new logic, edge cases, and error paths.
- For UI flows, look for documented manual validation in `MANUAL_TEST_INSTRUCTIONS.md` or assets in `design_examples/`.

## Security & Configuration Tips
- Avoid storing secrets in the repo; use `.env` and local Expo config.
- Flag unexpected artifacts in `dist/`; ensure only intended build outputs exist.

