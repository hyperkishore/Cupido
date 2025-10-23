# Repository Guidelines

Cupido is an Expo-driven React Native app. Use this guide to navigate, build, and contribute with confidence.

## Project Structure & Module Organization
- Source in `src/`: `components/`, `screens/`, `services/`, `contexts/`.
- Shared code in `src/utils/` and `src/types/`.
- Assets and mock data in `assets/` and `data/`.
- Automation in `scripts/`; examples/manual flows in `design_examples/` and `MANUAL_TEST_INSTRUCTIONS.md`.
- Web bundles in `dist/` (delete stale bundles before check-in).
- Server/integration entry points: `index.ts`, `server.js`.

## Build, Test, and Development Commands
- Install deps: `npm install`.
- Start dev server: `npm run start` (Expo). Platform targets: `npm run web`, `npm run ios`.
- Build web bundle: `npm run build`; production: `npm run build:production` (outputs to `dist/`).
- Lint & fix: `npm run lint`.
- Type check: `npm run type-check`.
- Unit tests: `npm run test:unit`.

## Coding Style & Naming Conventions
- TypeScript + functional React. 2-space indent, single quotes, trailing commas.
- Names: Components/Screens `PascalCase`, hooks `useCamelCase`, helpers `camelCase`.
- Co-locate styles with `StyleSheet.create` in the same file unless shared.
- Run lint before pushing; do not bypass existing ESLint suppressions without comment.

## Testing Guidelines
- Unit tests live in `tests/` with Node assertions; custom mocks in `tests/setup/`.
- Name tests `<feature>.test.js`; add/extend when adding logic.
- Run `npm run test:unit` locally; aim to cover new branches and error paths.
- For UI-only changes, document manual validation in the PR and add a screenshot or story when helpful.

## Commit & Pull Request Guidelines
- Commits: concise, imperative (e.g., `feat: improve reflection prompts`), group related changes.
- PRs: describe problem, solution, and follow-ups; link Supabase schema/config updates when relevant.
- Include screenshots/recordings for UI tweaks; confirm `lint`, `type-check`, and `test:unit` pass.

## Security & Configuration Tips
- Never commit secrets; prefer `.env` and local Expo config.
- Verify `dist/` contains only intended build artifacts; remove leftovers before pushing.

