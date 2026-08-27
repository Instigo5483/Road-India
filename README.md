<p align="center">
  <img src="public/logo.svg" alt="Road India" width="420" />
</p>

Report road problems, infrastructure grievances, and live emergencies in under a minute — built for the **Build What Moves India** hackathon.

A Blinkit/Zepto-style fast reporting flow: pick a category, select every issue type that applies, add a photo, drop a pin on the map, done. Every report is trackable in a personal dashboard, visible on a public feed where the community can upvote existing reports instead of filing duplicates, and openable as a full detail popup (map included) from any account type — citizen, admin, or response team.

## Features

- **Three report categories, multi-select issue types** — Road Problem (potholes, waterlogging…), Road Corruption (bad roads, missing footpaths, incomplete work, missing signs…), Road Emergency (accidents, road clashes, breakdowns…). Within a category, a citizen can select more than one issue at once (e.g. "Accident" + "Fire hazard" on the same report) instead of being limited to a single type.
- **Two-step report flow** — Step 1: issue type(s), photos, situation details. Step 2: precise map-based location picker (drag/tap to place a pin, "use my current location", reverse-geocoded address) with an automatically recorded timestamp.
- **Report detail popup** — clicking any report (citizen feed, dashboard, admin dashboard, or response-team job) opens a full-detail modal: photos, description, AI triage, and a read-only map pinned to the exact reported location, so there's never ambiguity about where an issue actually is.
- **AI-assisted triage** — every report is triaged in real time by an OpenAI model: severity, a suggested department, and a caseworker-ready summary, shown to the citizen right after submitting (see [AI-assisted triage](#ai-assisted-triage) below).
- **Account system** — the main "Log in" entry point first asks which of three roles you're signing in as (User, Admin, Response Team), each with its own separate auth. The citizen ("User") path is a choice between an Aadhaar (12-digit ID + OTP) or DigiLocker (simulated redirect) verification flow, with a profile stored per user (see [Demo auth](#demo-auth-not-real-aadhardigilocker) below).
- **Dashboard** — every report you've filed, with live status (Submitted → In Review → In Progress → Resolved), and dynamic homepage stats (reports filed / resolved / cities covered) computed live from the actual database rather than hardcoded numbers.
- **Ongoing Reports feed** — every report from every user, Reddit-style upvoting so the most-supported issues surface first, filters by category and location ("near me" via geolocation, distance shown per report), search, and sort by relevance / recency / distance. Live emergencies are always pinned to the top.
- **Language selection** — available before login on the landing page and again inside the dashboard. English and Hindi are fully translated; only complete languages are listed in the switcher (see [Adding a language](#adding-a-language) below to add more).
- **Admin dashboard** — a separate staff-only view at `/admin` of every report across all users: search by report ID/description/address/reporter, filter by category/status/time-range/state/district/city, a dropdown to move each report's status, and — for emergencies — a control to see and change which response team is assigned to which report (see [Admin dashboard](#admin-dashboard) below).
- **Emergency response-team dispatch** — a Blinkit/Zepto-style web dashboard at `/team` for ambulance/doctor/fire/police/tow teams: filing an emergency report automatically finds and pushes a notification to the nearest available team of the right type(s) — a report with multiple emergency types dispatches every relevant team type at once — and the team taps "Mark completed" when done (see [Emergency response-team dispatch](#emergency-response-team-dispatch) below).
- **Motion throughout** — hover/tap micro-interactions on every card and button, animated step transitions in the report flow, animated route transitions, and a live pulsing map pin, all via Framer Motion.

## Tech stack

React 18 + Vite + Tailwind CSS + Framer Motion, React Router v6, Leaflet / react-leaflet (OpenStreetMap tiles, no API key required), Firebase (Auth + Firestore + Cloud Messaging) for the backend, an OpenAI model (`gpt-4o-mini`) via a Vercel serverless function for AI-assisted report triage, and a second Vercel serverless function for emergency dispatch (deliberately not Firebase Cloud Functions — see [Emergency response-team dispatch](#emergency-response-team-dispatch) for why — so the whole project stays on free tiers end to end).

## Quick start (works with zero setup)

```bash
npm install
npm run dev
```

The app runs immediately with **no Firebase project required** — it falls back to an in-memory + `localStorage` mock backend (see `src/lib/mockBackend.js`) seeded with demo reports, so you can click through the entire flow (sign up, file a report, upvote, filter) right away. This is intentional: it's what makes the app instantly demoable for hackathon judging. (Admin dashboard filtering, status updates, and search all work on the mock backend too; the response-team dashboard and admin team management need a real Firebase project — see below.)

## Connecting a real Firebase backend

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Anonymous** (the simulated DigiLocker flow signs the verified user in anonymously and attaches their profile in Firestore — no real phone/OTP provider needed).
3. Enable **Firestore Database**. (Report photos are stored inline as base64 in Firestore, not in Firebase Storage — Storage requires the paid Blaze plan, which this project intentionally stays off of; see `PhotoUpload.jsx`'s client-side compression that keeps this well under Firestore's document size limit.)
4. Project settings → General → Your apps → add a Web app, copy the config values into a `.env.local` file (see `.env.example`).
5. Deploy the included security rules: `firebase deploy --only firestore:rules` (requires the [Firebase CLI](https://firebase.google.com/docs/cli), `firebase init` once to link the project — the repo already has `firestore.rules`).
6. Optional: seed the Firestore `reports` collection with the same demo data the mock backend uses — see `scripts/seed.js`.

Once real Firebase env vars are present, the app automatically switches from the mock backend to Firestore — no code changes needed, see `isFirebaseConfigured` in `src/lib/firebase.js`.

### Demo auth (not real Aadhaar/DigiLocker)

`/login` first asks which of three roles you're signing in as — **User**, **Admin**, or **Response Team** — since a real deployment would have three genuinely separate audiences who wouldn't otherwise know to look for `/admin/login` or `/team/login`. Choosing **Admin** or **Response Team** navigates straight to their own login pages (see [Admin dashboard](#admin-dashboard) / [Emergency response-team dispatch](#emergency-response-team-dispatch) below); choosing **User** continues into the flow described here.

Real Aadhaar/DigiLocker integration requires UIDAI/DigiLocker API partner access that isn't obtainable for a hackathon prototype. The citizen login screen (`src/pages/Login.jsx`) instead offers a choice of two simulated flows: **Aadhaar** (enter a 12-digit Aadhaar-linked ID, receive an on-screen OTP — no real SMS is sent — verify, then confirm a name and language) or **DigiLocker** (a brief simulated "Connecting to DigiLocker…" redirect that skips straight to the name/language step, mirroring how a real DigiLocker OAuth hand-off never asks you to retype your Aadhaar number). No real Aadhaar, DigiLocker, or government data is requested, transmitted, or stored anywhere in this codebase. Swap this out for a real OAuth/identity provider before using this beyond a prototype.

## AI-assisted triage

Every filed report is triaged by an OpenAI model in real time: severity (`low`/`medium`/`high`/`critical`), a suggested responsible department, and a one-line caseworker-ready summary — shown to the citizen immediately on the success screen, and as a small badge on the report in the feed/dashboard/admin view (`src/components/AiTriageCard.jsx`). Since a report can carry multiple issue types, all of them are passed to the model as context.

- **Server-side only** — the actual OpenAI call happens in `api/_triage-core.js`, invoked by `api/triage.js` (the Vercel serverless endpoint used in production) and mirrored by a Vite dev-server middleware (`vite.config.js`) so `npm run dev` exercises the identical code path locally, no Vercel CLI required.
- **Set `OPENAI_API_KEY`** in `.env.local` (see `.env.example`) to enable real triage. This is a **server-only** secret — it is never prefixed with `VITE_` and never shipped to the browser bundle.
- **Zero setup fallback** — without an API key, triage falls back to a deterministic rule-based mock (`mockTriage` in `api/_triage-core.js`) so the full citizen journey, AI step included, still works end-to-end out of the box.

## Admin dashboard

`/admin/login` → `/admin` — a staff view of every report filed across the app (not just one citizen's own).

- **Search and filters** — search by report ID, description, address, or reporter name; filter chips for category and status; a collapsible filter panel for time range and cascading state/district/city (mirroring the citizen Ongoing Reports feed's filters, sharing the same logic via `src/lib/reportFilters.js`). A per-report dropdown moves status through Submitted → In Review → In Progress → Resolved. Live emergencies sort to the top.
- **Report detail popup** — click any report row to open the same detail modal (with map) the citizen feed uses, without leaving the dashboard.
- **Response team management, on its own page** — `/admin/teams` shows the full roster (name, type, ID, live status); `/admin/teams/new` provisions a new team. The admin chooses the team's own **ID and passcode** directly (rather than one being auto-generated) and picks a **base area** from a city dropdown (`src/data/cities.js`) rather than dropping an exact map pin — a team's coverage is naturally city-level, and a city center is precise enough for the nearest-team dispatch match.
- **See and change team assignment** — each emergency report row shows a dropdown per required team type (ambulance, doctor, fire, police, tow — derived from the report's issue type(s)) with the currently assigned team, or "Unassigned". Changing it (`src/lib/teams.js`'s `reassignReportTeam`) frees the previous team back to `available` and marks the new one `busy` on that report.
- **Separate from citizen login** — real municipal staff wouldn't authenticate through a citizen Aadhaar/DigiLocker flow, so `/admin` uses its own passcode gate (`src/context/AdminAuthContext.jsx`), independent of `AuthContext`.
- **Passcode**: set `VITE_ADMIN_PASSCODE` in `.env.local`, or use the default `roadindia-admin` if unset (see `.env.example`). **This is a client-side convenience gate for the prototype, not real access control** — change the default before sharing a live deployment link publicly.
- **Not a real role system** — there's no per-admin identity or backend-enforced permission check. In `firestore.rules`, any authenticated Firebase user (not just someone who knows the admin passcode) can update a report's `status`/`assignedTeams` fields or a team's fields — a documented prototype limitation. Add a custom-claims-based admin role before handling real citizen data at scale.
- **`/admin/login` shows its passcode directly on the page** (labeled "for evaluation only") so hackathon judges/reviewers can sign in without needing credentials passed along separately.
- **Team management requires a real Firebase project** — on the local mock backend, `/admin/teams` and `/admin/teams/new` show an explanatory message instead of the roster/form, same as the response-team dashboard below.

## Emergency response-team dispatch

`/team/login` → `/team` — a plain web dashboard for response teams (**this is a website, not a mobile/installable app** — it lives at a normal URL, works in any browser, and needs nothing installed), kept in the same React/Vite/Firebase codebase rather than a separate project.

**How dispatch works:**
1. A citizen files an emergency report (`category: 'emergency'`), possibly with more than one issue type selected (e.g. "Accident" + "Fire hazard").
2. Right after it's saved, the client calls `POST /api/dispatch` (`api/_dispatch-core.js`), which unions every selected type's required response-team type(s) (`src/data/teamTypes.js` — e.g. `accident` → `ambulance` + `doctor`, `fire_hazard` → `fire`, so an accident-and-fire report pulls in all three), and for each required type finds the **nearest `available` team** by straight-line distance to the report's location.
3. That team's Firestore doc is marked `busy` and given `currentReportId`; if the team has a push token, a Firebase Cloud Messaging notification is sent to their device.
4. The team's dashboard (`/team`, `src/pages/TeamDashboard.jsx`) shows the job live the moment `currentReportId` changes — via a Firestore listener while the page is open, or via a browser push notification when it isn't — with an embedded map of the exact location, a "Navigate" button (opens Google Maps), and the same AI-triage summary the citizen sees.
5. Tapping **Mark completed** sets the report's status to `resolved` (the same `updateReportStatus` the admin dashboard uses — reflected on the citizen's dashboard and the community feed instantly) and frees the team back to `available`.
6. An admin can also see which team is assigned and reassign it at any point from `/admin` — see [Admin dashboard](#admin-dashboard) above.

**Browser push notifications, not an installed app:** teams get notified via Cloud Messaging in a normal browser tab — no "Add to Home Screen" step, no app store, nothing to install. The tradeoff: push reliability while the tab is fully closed (rather than just backgrounded) varies by browser, and continuous location tracking only happens while a team actually has the dashboard open (`TeamDashboard.jsx`'s `watchPosition`) — there's no background tracking once the page is closed, same as any website.

**Why a Vercel function instead of a Firebase Cloud Function:** Cloud Functions of any generation require Firebase's paid **Blaze plan** to deploy at all, regardless of actual usage/cost. Firestore, Auth, Storage, and Cloud Messaging are all free on the **Spark plan** — the only thing a Cloud Function would have added here is a Firestore-triggered invocation, which this replaces with the client calling `/api/dispatch` right after creating the report. Functionally equivalent for a demo, and keeps the whole project on free tiers end to end.

Requires a real Firebase project (no mock-backend equivalent — Firestore-backed team matching and push notifications can't be simulated locally the way AI triage's mock fallback works). To set it up:

1. Complete [Connecting a real Firebase backend](#connecting-a-real-firebase-backend) above first — **the free Spark plan is enough, no billing required.**
2. Enable **Cloud Messaging** (Project settings → Cloud Messaging), then **Web configuration → Generate key pair** for a VAPID key. Set `VITE_FIREBASE_VAPID_KEY` in `.env.local`.
3. Project settings → **Service accounts** → Generate new private key, then base64-encode it into `FIREBASE_SERVICE_ACCOUNT` (see `.env.example` for the exact command) — this lets `api/dispatch.js` read/write Firestore and send pushes server-side.
4. Deploy the updated Firestore rules: `firebase deploy --only firestore:rules`.
5. Seed a few demo teams: `npm run seed:teams` (needs the same `scripts/serviceAccountKey.json` as `npm run seed`; see that script's usage comment) — or add more anytime from `/admin/teams/new`.
6. Visit `/team/login` and sign in with any seeded team ID/passcode from `scripts/seedTeams.js` (e.g. `amb-001` / `amb-001-pass`) — the same six are also listed directly on the `/team/login` page for evaluators.

**Auth and security note**: like the admin dashboard, `/team` uses a lightweight passcode-per-team gate (`src/context/TeamAuthContext.jsx`), not a real per-team identity/role system — see the comments in `firestore.rules` for exactly what that does and doesn't protect. Replace with real team accounts before handling this beyond a prototype.

## Deployment

Most of this app is a static Vite build, but **AI triage and emergency dispatch both need Node serverless functions** (`api/triage.js`, `api/dispatch.js`), so the deployment target matters:

- **Vercel (recommended, and fully free)** — import the GitHub repo; Vercel auto-detects the Vite build (`npm run build`, output `dist`) and the `/api` serverless functions with no extra config, all on Vercel's free Hobby tier. Add `VITE_FIREBASE_*`, `OPENAI_API_KEY`, and `FIREBASE_SERVICE_ACCOUNT` as environment variables in the project's dashboard. `vercel.json` includes the SPA rewrite needed for direct navigation to client-side routes (e.g. `/login`) to work. This is the only option below where AI triage and emergency dispatch actually run in production.
- **Netlify / Firebase Hosting / GitHub Pages** — these serve the static `dist` build fine, but don't run `/api/*.js` as-is (Netlify would need equivalent Netlify Functions; Firebase Hosting would need Cloud Functions, which cost real money to deploy at all — see the note above). Without them, `triageReport()`/`dispatchEmergency()` just fail their fetch and no-op — reports still file successfully, just without an AI assessment or team dispatch attached.

## Project structure

```
api/
  triage.js            Vercel serverless endpoint -- POST /api/triage
  _triage-core.js      Shared triage logic (real OpenAI call + mock fallback)
  dispatch.js          Vercel serverless endpoint -- POST /api/dispatch
  _dispatch-core.js    Shared dispatch logic (nearest-team matching + FCM push)
src/
  components/   Reusable UI: cards, buttons, map picker/viewer, report detail modal, AI triage card,
                admin report row, filter dropdown, logo, icons, nav, etc.
  context/      AuthContext, LanguageContext, ReportsContext, AdminAuthContext, TeamAuthContext
  data/         Category/type definitions, language list, demo seed reports, team types, cities
  i18n/         en.js, hi.js dictionaries + translate() helper
  lib/          firebase.js, mockBackend.js, triage.js, dispatch.js, messaging.js, teams.js,
                reportFilters.js, geo.js, mapPin.js, time.js
  pages/        Landing, Login, Home, ReportFlow, Dashboard, ReportsFeed, Settings,
                AdminLogin, Admin, AdminTeams, AdminAddTeam, TeamLogin, TeamDashboard
  styles/       Tailwind entry + small custom CSS (map pin animation etc.)
public/
  logo.svg                    Full Road India logo (mark + wordmark), used in this README
  favicon.svg                 Browser tab icon -- just the logo mark, no wordmark
  firebase-messaging-sw.js    Browser push notification handler for /team
firebase.json    Firebase CLI config (Firestore rules)
firestore.rules  Security rules for the reports/users/teams collections
scripts/seed.js       Optional: seed a real Firestore project with demo reports
scripts/seedTeams.js  Optional: seed a real Firestore project with demo response teams
```

## Adding a language

1. Add the language to `src/data/languages.js` (or flip `complete: true` if you're about to translate it).
2. Create `src/i18n/<code>.js` exporting the same keys as `src/i18n/en.js`.
3. Register it in `src/i18n/index.js`'s `dictionaries` map.

Any language not registered there automatically falls back to English text, so the switcher never breaks — it just shows English until translated.

## Hackathon submission

Built for [Build What Moves India](https://buildwhatmovesindia.com/brief). See [SUBMISSION.md](SUBMISSION.md) for the full project summary, what's real vs. mocked, and how this could work at scale.

## License

MIT — see [LICENSE](LICENSE).
