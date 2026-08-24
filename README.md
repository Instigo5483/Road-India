# Road India

Report road problems, infrastructure grievances, and live emergencies in under a minute — built for the **Build What Moves India** hackathon.

A Blinkit/Zepto-style fast reporting flow: pick a category, add a couple of details and a photo, drop a pin on the map, done. Every report is trackable in a personal dashboard, and visible on a public feed where the community can upvote existing reports instead of filing duplicates.

## Features

- **Three report categories** — Road Problem (potholes, waterlogging…), Road Corruption (bad roads, missing footpaths, incomplete work, missing signs…), Road Emergency (accidents, road clashes, breakdowns…), each with its own category-specific issue-type dropdown.
- **Two-step report flow** — Step 1: issue type, photos, situation details. Step 2: precise map-based location picker (drag/tap to place a pin, "use my current location", reverse-geocoded address) with an automatically recorded timestamp.
- **AI-assisted triage** — every report is triaged in real time by an OpenAI model: severity, a suggested department, and a caseworker-ready summary, shown to the citizen right after submitting (see [AI-assisted triage](#ai-assisted-triage) below).
- **Account system** — a choice between an Aadhaar (12-digit ID + OTP) or DigiLocker (simulated redirect) verification flow, with a profile stored per user (see [Demo auth](#demo-auth-not-real-aadhardigilocker) below).
- **Dashboard** — every report you've filed, with live status (Submitted → In Review → In Progress → Resolved).
- **Ongoing Reports feed** — every report from every user, Reddit-style upvoting so the most-supported issues surface first, filters by category and location ("near me" via geolocation, distance shown per report), search, and sort by relevance / recency / distance. Live emergencies are always pinned to the top.
- **Language selection** — available before login on the landing page and again inside the dashboard. English and Hindi are fully translated; the other major Indian languages are listed in the switcher and fall back to English text until translated (see [i18n](#adding-a-language)).
- **Admin dashboard** — a separate staff-only view at `/admin` of every report across all users, filterable by category/status, with a dropdown to move each report's status (see [Admin dashboard](#admin-dashboard) below).
- **Motion throughout** — hover/tap micro-interactions on every card and button, animated step transitions in the report flow, animated route transitions, and a live pulsing map pin, all via Framer Motion.

## Tech stack

React 18 + Vite + Tailwind CSS + Framer Motion, React Router v6, Leaflet / react-leaflet (OpenStreetMap tiles, no API key required), Firebase (Auth + Firestore) for the backend, an OpenAI model (`gpt-4o-mini`) via a Vercel serverless function for AI-assisted report triage.

## Quick start (works with zero setup)

```bash
npm install
npm run dev
```

The app runs immediately with **no Firebase project required** — it falls back to an in-memory + `localStorage` mock backend (see `src/lib/mockBackend.js`) seeded with demo reports, so you can click through the entire flow (sign up, file a report, upvote, filter) right away. This is intentional: it's what makes the app instantly demoable for hackathon judging.

## Connecting a real Firebase backend

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Anonymous** (the simulated DigiLocker flow signs the verified user in anonymously and attaches their profile in Firestore — no real phone/OTP provider needed).
3. Enable **Firestore Database** and **Storage** (Storage holds uploaded report photos).
4. Project settings → General → Your apps → add a Web app, copy the config values into a `.env.local` file (see `.env.example`).
5. Deploy the included security rules: `firebase deploy --only firestore:rules,storage` (requires the [Firebase CLI](https://firebase.google.com/docs/cli), `firebase init` once to link the project — the repo already has `firestore.rules` and `storage.rules`).
6. Optional: seed the Firestore `reports` collection with the same demo data the mock backend uses — see `scripts/seed.js`.

Once real Firebase env vars are present, the app automatically switches from the mock backend to Firestore — no code changes needed, see `isFirebaseConfigured` in `src/lib/firebase.js`.

### Demo auth (not real Aadhaar/DigiLocker)

Real Aadhaar/DigiLocker integration requires UIDAI/DigiLocker API partner access that isn't obtainable for a hackathon prototype. The login screen (`src/pages/Login.jsx`) instead offers a choice of two simulated flows: **Aadhaar** (enter a 12-digit Aadhaar-linked ID, receive an on-screen OTP — no real SMS is sent — verify, then confirm a name and language) or **DigiLocker** (a brief simulated "Connecting to DigiLocker…" redirect that skips straight to the name/language step, mirroring how a real DigiLocker OAuth hand-off never asks you to retype your Aadhaar number). No real Aadhaar, DigiLocker, or government data is requested, transmitted, or stored anywhere in this codebase. Swap this out for a real OAuth/identity provider before using this beyond a prototype.

## AI-assisted triage

Every filed report is triaged by an OpenAI model in real time: severity (`low`/`medium`/`high`/`critical`), a suggested responsible department, and a one-line caseworker-ready summary — shown to the citizen immediately on the success screen, and as a small badge on the report in the feed/dashboard (`src/components/AiTriageCard.jsx`).

- **Server-side only** — the actual OpenAI call happens in `api/_triage-core.js`, invoked by `api/triage.js` (the Vercel serverless endpoint used in production) and mirrored by a Vite dev-server middleware (`vite.config.js`) so `npm run dev` exercises the identical code path locally, no Vercel CLI required.
- **Set `OPENAI_API_KEY`** in `.env.local` (see `.env.example`) to enable real triage. This is a **server-only** secret — it is never prefixed with `VITE_` and never shipped to the browser bundle.
- **Zero setup fallback** — without an API key, triage falls back to a deterministic rule-based mock (`mockTriage` in `api/_triage-core.js`) so the full citizen journey, AI step included, still works end-to-end out of the box.

## Admin dashboard

`/admin/login` → `/admin` — a staff view of every report filed across the app (not just one citizen's own), with category/status filters and a per-report dropdown to move status through Submitted → In Review → In Progress → Resolved. Live emergencies sort to the top.

- **Separate from citizen login** — real municipal staff wouldn't authenticate through a citizen Aadhaar/DigiLocker flow, so `/admin` uses its own passcode gate (`src/context/AdminAuthContext.jsx`), independent of `AuthContext`.
- **Passcode**: set `VITE_ADMIN_PASSCODE` in `.env.local`, or use the default `roadindia-admin` if unset (see `.env.example`). **This is a client-side convenience gate for the prototype, not real access control** — change the default before sharing a live deployment link publicly.
- **Not a real role system** — there's no per-admin identity or backend-enforced permission check. In `firestore.rules`, any authenticated Firebase user (not just someone who knows the admin passcode) can update a report's `status` field — a documented prototype limitation. Add a custom-claims-based admin role before handling real citizen data at scale.

## Deployment

Most of this app is a static Vite build, but **the AI-triage feature requires a Node serverless function** (`api/triage.js`), so the deployment target matters:

- **Vercel (recommended)** — import the GitHub repo; Vercel auto-detects the Vite build (`npm run build`, output `dist`) and the `/api` serverless functions with no extra config. Add `VITE_FIREBASE_*` and `OPENAI_API_KEY` as environment variables in the project's dashboard. This is the only option below where AI triage actually runs in production.
- **Netlify / Firebase Hosting / GitHub Pages** — these serve the static `dist` build fine, but don't run `/api/triage.js` as-is (Netlify would need an equivalent Netlify Function, Firebase would need a Cloud Function). Without it, `triageReport()` fails its fetch and returns `null` gracefully — reports still file successfully, just without an AI assessment attached.

## Project structure

```
api/
  triage.js          Vercel serverless endpoint -- POST /api/triage
  _triage-core.js     Shared triage logic (real OpenAI call + mock fallback)
src/
  components/   Reusable UI: cards, buttons, map picker, AI triage card, admin report row, icons, nav, etc.
  context/      AuthContext, LanguageContext, ReportsContext, AdminAuthContext
  data/         Category/type definitions, language list, demo seed reports
  i18n/         en.js, hi.js dictionaries + translate() helper
  lib/          firebase.js, mockBackend.js, triage.js, geo.js, time.js
  pages/        Landing, Login, Home, ReportFlow, Dashboard, ReportsFeed, AdminLogin, Admin
  styles/       Tailwind entry + small custom CSS (map pin animation etc.)
firestore.rules  Security rules for the reports/users collections
scripts/seed.js  Optional: seed a real Firestore project with demo reports
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
