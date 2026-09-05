# Maintenance audit — 5 September 2026

## Completed

- Removed 19 retired/unreachable source, API, worker, and seeding files plus five unused images. Removed emergency/team routes, provider, dispatch hooks, legacy rule permissions, two unused icons, and 113 unused translation keys from each dictionary. All deletions are recoverable from Git; no live records were deleted.
- Preserved old Road Problem/Corruption records and the current unified reporting flow. Excluded old emergency records from current views without modifying storage.
- Lazy-loaded Login, report details, map picker, and map/list alternatives. Kept shared analytics controls and worldwide navigation. Restored dependency preloading when lazy routes are requested.
- Fixed indefinite request waits; triage transmits only one image. The merged issue category now receives the correct fallback department. Model output is whitelisted/validated, following [OpenAI's JSON-mode guidance](https://developers.openai.com/api/docs/guides/structured-outputs).
- Added a recoverable page-error screen and report-list retry notice; guarded unavailable browser storage.
- Fixed zero-coordinate handling, stale geocoding responses, and automatic GPS overwriting a saved report location while editing.
- Fixed support-count races with Firestore transactions, duplicate in-flight vote requests, premature success toasts, missing feedback error handling, and stale report details.
- Added transaction-time edit/feedback/resolution checks, corresponding rules validation, and input/document size budgets.
- Fixed admin daily chart heights and missing/invalid timestamp handling. Reduced repeated array copying in location analytics.
- Mounted report-status notifications once for all routes, scoped seen statuses by account, stabilized toast context values, and cleaned up toast timers.
- Added dialog keyboard focus management and reduced-motion support. Split provider hooks/constants to eliminate Fast Refresh lint warnings.
- Shared demo fixtures between mock and seed workflows. Seeding no longer overwrites existing records; clearing data now requires the exact target project ID.

## Verification

- `npm test`: 22 passing tests covering core helpers, mock identity/data persistence, request timeout/fallback handling, import reachability, and both translation dictionaries. All API responses in automated tests are mocked.
- `npm run lint`: no errors or warnings.
- `npm run build`: successful production bundle.
- Browser checks: Home, ongoing reports rendering and GPS-unavailable fallback, public analytics map modes/pin details, admin sign-in, report management navigation, and admin analytics resolved-only pins.
- Main application chunk: approximately 110.91 kB → 89.13 kB uncompressed (37.22 kB → 31.27 kB gzip). Main CSS: 49.64 kB → 46.19 kB uncompressed. These are bundle sizes, not measured page-load timings.

## Remaining limitations and rollout checks

- Compatible dependency updates and a same-major Undici override were applied. The final install audit reports **11 advisories: 10 moderate and 1 high**. Remaining dependency paths involve Vite/esbuild, React Router, and Firebase Admin's UUID dependencies; npm proposes major upgrades to clear them. These migrations were not forced. Keep the development server private, and plan/test major upgrades separately. Re-run `npm audit` as advisory data changes.
- Administrator access is still the intentionally client-visible evaluation passcode; mock identity is not government verification. Updated field validation does not replace verified server-side roles.
- Deploy the changed `firestore.rules` separately before hosted regression testing. No rules or website deployment was performed.
- Java/Firebase CLI were unavailable in this environment, so the rules were reviewed but not compiled/tested in a Firestore emulator. Test create, edit-stage restrictions, support add/remove, proof completion, feedback, and presentation updates in an isolated Firebase project before production.
- Live Firebase identity, OpenAI billing/network behavior, and a full mobile/device/browser matrix were not certified by these local tests.
- Firestore still subscribes to the report collection and photos remain inline. Moving to paginated server queries and separate image storage would require a data/API migration; no silent data truncation or storage migration was introduced.
