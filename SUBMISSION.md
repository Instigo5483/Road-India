# Road India — Build What Moves India

## Project summary (under 250 words)

Road India turns road complaints into a visible journey from evidence to resolution.

Citizens can report potholes, waterlogging, damaged roads, missing footpaths, or unfinished infrastructure through one mobile-first flow. They select multiple issues, attach photos, and pin the exact location. OpenAI-assisted triage analyzes the description and first photo to suggest severity, a responsible department, and a concise review summary.

Instead of leaving citizens with an opaque complaint number, Road India provides searchable public feeds, live progress tracking, and a resolved-report archive. Nearby-report suggestions and community support help reduce duplicate complaints. When administrators mark a report resolved, its author can rate the work and confirm or dispute the outcome—making closure more accountable.

Public analytics show reporting trends, resolution performance, issue distribution, and geographic concentration. English/Hindi support and mobile bottom navigation make the experience accessible on a phone. Settings provide public-name preferences, optional local drafts, data export, and feedback.

Built with React, Vite, Tailwind CSS, Firebase, and Vercel server functions, Road India connects citizen evidence, administrative review, and public transparency in one browser-based experience.

Identity verification and administrator access are explicitly evaluation-only. The project demonstrates a practical reporting and accountability workflow, not a live government service or emergency-dispatch system.

## Reviewer access

- **Public website:** [road-india.vercel.app](https://road-india.vercel.app/)
- **Repository:** [Instigo5483/Road-India](https://github.com/Instigo5483/Road-India)
- **Citizen login:** open `/login`; use test ID `123456789012`, then any six-digit OTP such as `123456`. Review the account name, select a preferred language, and continue.
- **DigiLocker:** simulated browser-local test identity; no government OAuth is performed.
- **Admin:** open `/admin` directly. It redirects to `/admin/login` if needed. The default passcode is `roadindia-admin`; the page displays the deployment's configured evaluation passcode.
- **Video:** add the final public video link before submitting.
- **Team:** add the partner's registered email only if submitting as a registered pair.

No installation is required. Public home, ongoing reports, resolved reports, and analytics can be viewed without citizen login. Please use fictional identity information only.

## Suggested two-minute demonstration

### First minute — citizen experience

1. Show the unified home page and mobile navigation.
2. Sign in with a test ID, then select multiple road issues and attach evidence.
3. Pin the location and submit; point out AI-assisted severity and summary.
4. Open My Reports to show the report ID, progress tracker, and map.
5. Show an existing resolved report and its citizen-confirmation/review.

Use prepared test records for completed statuses rather than implying an actual repair happened during the recording.

### Second minute — implementation and choices

1. Explain React/Vite/Tailwind for a responsive browser interface.
2. Show that Firebase-backed pages share the same reports and live status updates.
3. Explain the server-side OpenAI text/photo triage and its fallback.
4. Show public analytics and admin review as the accountability loop.
5. Clearly distinguish the functioning workflow from mock identity, prototype authorization, and absent municipal integration.

## What the project implements

| Area | Current implementation |
| --- | --- |
| Reporting | One combined road/infrastructure flow with multi-select issues, photos and location |
| Discovery | Public search/filtering, support counts and nearby-report suggestions |
| Tracking | Submitted → In Review → In Progress → Resolved; report IDs and map details |
| Accountability | Author editing before work starts in the UI; one resolution rating and confirmation/dispute |
| Resolved archive | Public completed records, filters and average resolution time |
| Analytics | Time-based metrics, interactive charts, density/comparison maps, location rankings, CSV/GeoJSON export |
| Settings | Read-only identity, public display preferences, optional device drafts/history, compression, JSON export, rating and help |
| Administration | Direct-URL sign-in, report search/filtering, status changes and analytics |
| Accessibility | Mobile-first layouts, English/Hindi, keyboard-operable public-name selector |

## How AI is used

Report creation calls `POST /api/triage`. The shared server handler uses OpenAI `gpt-4o-mini` with the issue types, description, and first attached photo. It returns severity, a suggested department, and a short caseworker summary.

The key is stored server-side as `OPENAI_API_KEY`, never in the frontend bundle. A rule-based fallback is used when the key is absent or the upstream request fails. If the client request fails, a report can be filed without triage. Verify real-model operation on the final deployment before demonstrating it; a fallback result is not evidence of an OpenAI call.

The department is a suggestion for human review, not a confirmed handoff to a government agency.

## Implemented versus simulated

**Implemented, subject to configuration:** Firestore-backed reporting and updates, custom-token test login, text/photo AI triage, filtering, maps, report details, citizen feedback, public analytics, and preference persistence. With no Firebase configuration, a localStorage mock backend supports local evaluation instead.

**Simulated identity:** arbitrary test IDs and OTPs are accepted. No UIDAI/DigiLocker verification occurs. The supplied ID is processed and saved as a profile identifier; never use real identity data. Stable cross-browser test-account lookup requires the server credential and login endpoint. DigiLocker's generated test ID is browser-local.

**Prototype administrator authorization:** a shared client-visible passcode is displayed on the admin sign-in page. Removing its link from citizen login does not secure it. Firestore rules still permit broad authenticated operations; a production deployment needs server-enforced roles.

**Local-only features:** drafts and opted-in location history remain on the device, are not encrypted, and do not submit automatically. Cache clearing covers those records, not browser-managed map tiles. The experience rating is saved to the user's profile; it is not a separate support-ticket system.

**Not connected:** government repair workflows, contractor penalties, guaranteed SLAs, WhatsApp automation, and emergency dispatch as part of the current citizen journey. Hotline links lead to external services.

**Legacy repository caveat:** response-team routes, dispatch code, scripts, and rules still exist. They are not advertised as current core features and have not been fully removed or security-isolated.

## Why these choices?

- A website lets reviewers and citizens use the same public URL without an app download.
- One multi-issue form avoids requiring citizens to decide between road damage and infrastructure corruption before reporting.
- GPS-assisted maps and photos make location/evidence more useful than an address-only complaint.
- Firebase listeners connect status changes to the public and personal views.
- AI assists initial review while leaving administrative status decisions to people.
- Citizen confirmation distinguishes a marked resolution from a fix the reporter actually accepts.
- Public analytics make the shared dataset inspectable rather than hiding it behind an admin login.

These are design goals and implemented capabilities, not measured claims about outperforming every existing municipal portal.

## Before final submission

- [ ] Push the intended code and verify the public deployment.
- [ ] Deploy the current `firestore.rules`, including author-owned public-presentation updates.
- [ ] Verify `FIREBASE_SERVICE_ACCOUNT` and `OPENAI_API_KEY` in the server environment.
- [ ] Check public URLs in a fresh browser and at mobile width.
- [ ] Test repeat login, report submission, admin status update, resolution review, and preference saving.
- [ ] Use fictional records and avoid exposing credentials or sensitive identity/photo data in recordings.
- [ ] Attach a publicly accessible video no longer than two minutes.
- [ ] Paste the project summary above into the form.
- [ ] Add teammate details if applicable.
- [ ] Confirm the organizer's current eligibility, submission window, and required fields directly before submitting.

This document describes the repository; it does not certify the current live deployment or every hackathon requirement.

## Production follow-up

Replace mock identity and client-side role gates; restrict report mutations server-side; add validation, rate limiting, moderation, and automated regression tests; review public identifiers and photo retention; remove unused legacy routes; and complete privacy/security review before collecting real citizen information.
