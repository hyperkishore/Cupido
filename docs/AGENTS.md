# Repository Guidelines

## Project Structure & Module Organization
Cupido is an Expo-driven React Native app. Keep feature logic in `src/`, grouped by domain (`components`, `screens`, `services`, `contexts`). Shared utilities live in `src/utils` and `src/types`. Assets such as icons or mock data reside in `assets/` and `data/`. Automation scripts live under `scripts/`, while example artifacts and manual testing flows live in `design_examples/` and `MANUAL_TEST_INSTRUCTIONS.md`. Browser-ready exports land in `dist/`; remove stale bundles before check-in. Server helpers and integration entry points are anchored in `index.ts` and `server.js`.

## Build, Test, and Development Commands
- `npm install` syncs dependencies after pulling.
- `npm run start` launches the Expo dev server; use `npm run web` or `npm run ios` for platform-specific targets.
- `npm run build` creates a static web bundle in `dist/`; prefer `npm run build:production` for deploy artifacts.
- `npm run lint` runs ESLint with autofix across TypeScript sources; commit with a clean result.
- `npm run type-check` executes `tsc --noEmit` to catch type regressions.
- `npm run test:unit` runs the Node-based service tests in `tests/`.

## Coding Style & Naming Conventions
We ship TypeScript/React components with functional patterns. Stick to 2-space indentation, single quotes, and trailing commas on multiline structures. Name components and screens in `PascalCase`, hooks in `useCamelCase`, and shared helpers in `camelCase`. Co-locate styles via `StyleSheet.create` in the same file unless shared. Run `npm run lint` before pushing; do not bypass existing ESLint suppressions without comment.

## Testing Guidelines
Unit tests live beside utilities in `tests/`, using plain Node assertions and custom mocks from `tests/setup/`. Add new service tests as `<feature>.test.js` to match the current convention. Each feature PR should include or update coverage for new logic and execute `npm run test:unit` locally. For UI-only changes, document manual validation in the PR and consider adding a story or screenshot.

## Commit & Pull Request Guidelines
Commits should be concise and imperative, mirroring the existing `feat:`, `chore:`, or descriptive summary lines (e.g., `feat: improve reflection prompts`). Group related changes into a single commit when possible. Pull requests must describe the problem, the solution, and any follow-up tasks, and should link Supabase schema or configuration updates. Attach screenshots or screen recordings for UI tweaks, and confirm lint, type, and test commands in the checklist before requesting review.
