# Archive Candidates

Move the following assets into an `/archive` folder to reduce noise around the production build:

- `App.simple.tsx`: One-screen placeholder used to debug blank page issues; no longer wired into navigation (`App.simple.tsx:1`).
- `App.full.tsx`, `App.complex.tsx`, `App.mobile.tsx`, `App.debug.tsx`, `App.old.tsx`, `App.updated.tsx`: Alternative app shells superseded by the PixelPerfect entry point (`App.tsx:19`).
- `App.test.tsx`, `App.test-simple.tsx`, `App.backup.tsx`, `App.backup-20250724-112946.tsx` and the entire `backups/` directory: Historical snapshots preserved by the custom version-control script (`version-history.log:1`).
- `test-demo.js`, `test-debug.html`, `analyze-app.js`: One-off debugging utilities tied to the prior demo bootstrap; none are referenced by the current tooling.
- `src/services/matching.service.js`, `src/services/supabase.service.js`, `src/services/questionsService.ts`: Superseded service shells that duplicate the TypeScript implementations and risk drift (`src/services/matchingService.ts:1`).
- `src/services/demo/` mocks: Only needed when running the older demo flow described in `test-demo.js`; unused by the PixelPerfect screens.

Archiving these files keeps the root focused on the production-ready entry point while preserving history for reference.
