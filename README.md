<p align="center">
  <img src="public/logo.svg" alt="Road India" width="420" />
</p>

# Road India

**Report it. Fix it faster.** A mobile-first civic reporting website for road damage and infrastructure complaints, built for Build What Moves India.

[Live website](https://road-india.vercel.app/) · [Submission notes](SUBMISSION.md) · [MIT license](LICENSE)

Citizens can select multiple issues, attach photos, pin the location, and follow a report through review and resolution. Public feeds and analytics make progress visible; citizen feedback distinguishes an administrative closure from a confirmed fix.

## Current experience

- **One home page:** `/` and `/home` use the same screen, with database-backed impact statistics and a single reporting entry point.
- **One reporting flow:** Road Problem and Road Corruption are combined as `issue`. Select multiple problems, including potholes, waterlogging, damaged drainage, poor road quality, missing footpaths, and incomplete work.
- **Evidence and location:** up to three photos, description, an interactive map pin, and optional GPS-assisted location selection. Nearby unresolved reports encourage supporting an existing complaint.
- **AI assistance:** a server-side OpenAI call suggests severity, department, and a summary using the description, selected types, and first attached photo. A rule-based fallback is available.
- **Ongoing Reports:** public search by report ID/keyword, sorting, status/time and cascading state/district/city filters, location-assisted filtering, and community support.
- **Resolved Reports:** a public archive with filters, report details, citizen feedback, and average resolution time where timestamps are available.
- **View Data:** time filters, report/resolution trends, interactive issue-distribution charts, location rankings, density maps with reported/resolved/comparison modes, and CSV/GeoJSON downloads.
- **My Reports:** live counts, search, date/status filters, progress trackers, photos, and map/details access. Authors can edit Submitted/In Review reports and rate a resolved report from 1–5 stars, confirming or disputing its resolution.
- **Mobile-first navigation:** bottom navigation on smaller screens and desktop navigation on the main browsing pages. Login has no page-navigation bar. Light mode only.
- **Languages:** English and Hindi.
- **Admin access:** visit `/admin` directly. Signed-out administrators are redirected to `/admin/login`. The public citizen login does not offer an admin role selector.

### Settings

The mobile Settings page includes:

- Read-only account name and masked test identity, plus actual civic points and resolved counts.
- Public-name choices: first name/initial, anonymous citizen, or full saved account name.
- Optional account badge and civic-points display in public report details.
- Offline draft restoration for unfinished text, photos, and location on the same browser.
- Optional photo compression; oversized or unsupported photos produce an error instead of an invalid database upload.
- Opt-in history of the last 20 submitted report locations on the same device; no background tracking.
- JSON export of the user's reports, reviews, saved preferences, and local draft/history. The identity is masked and other users' upvote IDs are omitted.
- Confirmed clearing of the current account's local draft/history, without deleting submitted reports or signing out. This does not clear browser-managed map tiles.
- Website rating saved with preferences, bug-description/diagnostic download, a GitHub issue link, FAQs, privacy information, and sign-out.
- External hotline links; no WhatsApp integration.

Press **Save Preferences** to persist settings and the experience rating. Name/badge/points preferences update the author's existing report presentation fields and apply to new reports. Deploy the updated Firestore rules before testing these writes in a hosted environment.

Offline drafts and location history default to **off**. Drafts are not encrypted, do not submit automatically, and are not synchronized across devices. The website still needs connectivity to load and submit reports.

## Technology

| Layer | Implementation |
| --- | --- |
| UI | React 18, React Router 6, Tailwind CSS 3, Framer Motion |
| Build | Vite 5, route-level lazy loading, split vendor bundles |
| Maps | Leaflet/react-leaflet, OpenStreetMap tiles and reverse geocoding |
| Data | Firebase Authentication and Cloud Firestore; localStorage mock fallback |
| Server | Vercel Node functions, Firebase Admin SDK |
| AI | OpenAI `gpt-4o-mini` through `POST /api/triage` |
| Quality checks | ESLint and Vite production build |

Photos are stored inline in Firestore, not Firebase Storage. Compression caps individual image data URLs to leave room for three photos and report fields within document-size limits.

## Run locally

Install a Node.js version compatible with Vite 5 and npm, then:

```bash
npm install
npm run dev
```

Use the local URL printed by Vite. Without Firebase configuration, the app uses seeded reports and a localStorage-backed mock backend. This is intended for evaluation, not sensitive information.

```bash
npm run lint
npm run build
npm run preview
```

`npm run dev` mirrors the API handlers through Vite middleware. `npm run preview` serves the static build; it is not a substitute for the Vercel serverless runtime.

## Evaluation login

### Citizen

1. Open `/login`.
2. Choose Aadhaar and enter **any test 12-digit number**, for example `123456789012`.
3. Press Next and enter any six-digit test OTP, for example `123456`. No SMS is sent.
4. Review the saved/generated account name, choose English or Hindi, and continue.

DigiLocker is also simulated. It reuses a generated test ID saved in that browser; a different browser may receive a different ID.

The same test ID resolves to the same local mock account. With Firebase, stable identity requires the server-side login endpoint and `FIREBASE_SERVICE_ACCOUNT`. If custom-token login is unavailable, anonymous-auth fallback does not guarantee the same account across subsequent logins.

**Never enter a real Aadhaar number.** There is no UIDAI or DigiLocker verification. Entered IDs are processed and stored as profile identifiers; masking the UI does not mean the underlying identifier is absent from storage.

### Administrator

Open [the admin URL](https://road-india.vercel.app/admin), or `/admin` locally. The default evaluation passcode is `roadindia-admin`, unless overridden by `VITE_ADMIN_PASSCODE`.

The admin sign-in page displays the configured evaluation passcode. Hiding its link from citizen login is a navigation choice, **not a security control**. The dashboard supports report search/filtering, status changes, details/maps, and analytics at `/admin/analytics`.

## Firebase and environment setup

1. Create/select a Firebase project and register a Web app.
2. Create a Firestore database. Enable Anonymous Authentication if using the fallback path.
3. Copy `.env.example` to `.env.local` and fill in the Firebase Web app configuration.
4. Configure the Firebase CLI for the intended project and deploy rules:
   ```bash
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules
   ```
5. Generate a service-account JSON in Firebase project settings. Base64-encode it and set `FIREBASE_SERVICE_ACCOUNT` in the server environment. Never commit the JSON or paste it into client code.
6. Add `OPENAI_API_KEY` if you want real AI triage, then restart the dev server.

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Web app configuration |
| `FIREBASE_SERVICE_ACCOUNT` | Server-only base64 Firebase Admin credential for stable test login |
| `OPENAI_API_KEY` | Server-only OpenAI credential |
| `VITE_ADMIN_PASSCODE` | Client-visible evaluation gate, not a secret or role system |

`.env.example` also contains legacy Storage/Messaging configuration. Storage is not used for report photos; the current citizen flow does not require team push notifications.

Optional seed scripts exist under `scripts/`. Inspect their data and target project before running them. `npm run clear-data` is destructive and is **not** a required setup step. Never reset a shared database merely to test the UI.

## OpenAI integration

`ReportsContext.createReport` calls `src/lib/triage.js`, which posts to `/api/triage`. The shared handler in `api/_triage-core.js` sends issue types, description, and the first photo to OpenAI Chat Completions and requests structured JSON:

- Severity: low, medium, high, or critical.
- Suggested department.
- A short caseworker summary.

Successful model responses include `aiGenerated: true`; photo requests include `photoAnalyzed: true`. Without a key or after a handled upstream failure, the server uses a rule-based result. A failed client request can leave the report without a triage result.

The API key remains server-side. Do not put it in a `VITE_` variable. Report descriptions and the first photo are sent to OpenAI when enabled; avoid personal or sensitive evidence. AI output assists review and is not an official routing decision or response-time guarantee.

OpenAI usage can incur charges. Hosting/database quotas and provider terms also apply; this repository does not guarantee a zero-cost deployment.

## Vercel deployment

1. Import the repository into Vercel.
2. Use the Vite build command `npm run build` and output directory `dist`.
3. Add the Firebase Web variables and server-only credentials above.
4. Deploy the matching Firestore rules separately.
5. Deploy/redeploy the website after changing build-time environment variables.
6. Test direct navigation to `/reports`, `/resolved`, `/data`, and `/admin`.

`vercel.json` sends non-API routes to the SPA while keeping `/api/*` available to server functions. Static hosting alone does not execute these Vercel API handlers; stable Firebase login and real AI triage require a compatible backend.

## Security and scope limitations

This is an evaluation prototype, not production-ready identity or municipal infrastructure.

- Citizen identity verification is mocked. Knowing a test ID is sufficient to access its test account.
- Admin authentication is a client-side passcode gate; the passcode is client-visible and shown for evaluation.
- Current rules allow broad authenticated status/upvote operations. UI-only edit-stage restrictions are not equivalent to server-enforced authorization.
- Reports are publicly readable. Public-name settings change presentation fields, not ownership IDs, historical exports, or previously downloaded copies.
- Duplicate prevention is a client-side heuristic, not server-side rate limiting.
- No official contractor penalties, guaranteed repair SLA, or government dispatch integration is implemented.
- **Legacy code remains:** team routes (`/team`, `/team/login`, `/admin/teams`, `/admin/teams/new`), dispatch code, and related rules/scripts still exist in the repository. They are not part of the current unified citizen-reporting experience; do not describe them as fully removed or rely on hidden navigation to disable them.

Before collecting real citizen data, replace simulated identity and passcode gates, enforce roles and validation server-side, review public fields and photo storage, and add abuse protection and automated tests.

## Main project files

```text
api/                  Server handlers for login/triage; legacy dispatch
src/pages/            Home, Login, ReportFlow, ReportsFeed, ResolvedReports,
                      ViewData, Dashboard, Settings, admin and legacy team pages
src/components/       Navigation, reports, maps, charts, filters and feedback UI
src/context/          Authentication, reports, languages and notifications
src/lib/              Firebase/mock data, preferences, exports, geo and helpers
src/i18n/             English/Hindi dictionaries
public/               Road India logo and favicon
firestore.rules       Database access rules, including presentation updates
vercel.json           SPA routing
scripts/              Seeding and database maintenance utilities
```

## Quick regression checklist

- [ ] Public pages load on mobile and desktop; bottom navigation does not cover actions.
- [ ] Citizen login shows no Admin option; direct `/admin` opens admin sign-in.
- [ ] Reusing a test ID restores the expected account and read-only name.
- [ ] Multi-issue reports submit with and without photos; oversized images show feedback.
- [ ] Search works with report IDs; filters reset correctly.
- [ ] Details show the right pin and update as status changes.
- [ ] Authors can edit eligible reports and leave one resolution review.
- [ ] Analytics and archive counts match the selected database/time range.
- [ ] Preferences persist; public names update after successful saving.
- [ ] Opt-in drafts restore and clear after submission; location history remains opt-in.
- [ ] JSON/CSV/GeoJSON downloads contain the expected records.
- [ ] Logout redirects without a blank screen.

## License

MIT — see [LICENSE](LICENSE).
