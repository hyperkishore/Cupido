# Version History

Cupido’s repository only exposes partial git context, so the table below combines the documented commits with the custom backup log. Version numbers follow the commit-count scheme rendered in the header (`src/components/VersionDisplay.tsx:17`).

| Version | Reference | Commit Message / Comment | Notes |
| --- | --- | --- | --- |
| v1.0.0 | RESTORE_INSTRUCTIONS.md:167 | “Initial commit” (`f89be7a`) | Scaffolds the Expo project, baseline services, and documentation set. |
| v1.1.0 | version-history.log:1 | “Restored to App.full.tsx - clean navigation version” | Local backup capturing the pre–pixel-perfect navigation layer (`App.full.tsx`). |
| v1.1.1 | version-history.log:2 | “Before creating pixel-perfect UI replica” | Backup taken immediately prior to adopting the PixelPerfect screen family. |
| v1.1.2 | version-history.log:3 | “Before adding functionality to screens” | Backup preserved before wiring interactive props into the PixelPerfect views. |
| v1.2.1 | RESTORE_INSTRUCTIONS.md:4 | “Pixel-Perfect Design Implementation” (`a81a1cf`) | Introduces the current four-tab layout and PixelPerfect screens (`App.tsx:19`). |
| v1.2.2 | src/components/VersionDisplay.tsx:17 | (Commit message not recorded in repo) | Expands demo services and documentation; HEAD still depends on local mocks (`src/services/communityService.ts:58`). |

_There is no accessible history beyond these records; to recover additional metadata you would need to inspect the original git repository referenced in `RESTORE_INSTRUCTIONS.md`._
