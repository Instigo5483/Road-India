# Road India — Build What Moves India submission

## Project summary (for the submission form, <250 words)

Road India lets any citizen report a pothole, an unfinished road-work site, or
a live road emergency in under a minute — and shows them exactly what happens
to it next, instead of a black-box complaint form.

**The problem:** municipal road-issue channels are slow to file into (long
forms, no location precision), give no visibility after submission, and treat
every complaint identically — a life-threatening accident enters the same
queue as a faded lane marking.

**What we built:** a mobile-first flow — pick a category, select every issue
that applies, add a photo, drop a precise map pin, done. Every report is
triaged in real time by an OpenAI model (severity, department, caseworker
summary — shown to the citizen, not hidden). Emergency reports automatically
dispatch to the nearest available response team (ambulance/doctor/fire/
police/tow) through a live Firestore-backed matching system with push
notifications; the team sees the job on their own dashboard, navigates, and
marks it resolved. A separate admin dashboard lets staff search/filter every
report, update status, and reassign teams. A public, upvotable feed prevents
duplicate filing.

**What's mocked:** identity verification (a simulated Aadhaar/DigiLocker OTP
flow — no real UIDAI integration) and the admin/team sign-in (a shared
passcode per role, not a per-person identity system yet). Everything else —
AI triage, the reporting flow, live dispatch, the feed, tracking — runs
end-to-end against a real Firebase backend.

**At scale:** swap simulated auth for real DigiLocker OAuth, add custom-claims
-based roles for admin/team accounts, and connect dispatch to existing
municipal/112 infrastructure.

---

## Who is facing the problem?

Any Indian resident who has tried to report a road issue — a pothole that
damaged their vehicle, a road-work site abandoned for months, a live accident
or hazard — through an existing municipal channel and found it slow, opaque,
or not built for a phone. Municipal staff who have to triage and route those
reports by hand also face this, with no help prioritizing what's urgent.

## What is difficult about the current experience?

- Most municipal complaint portals are desktop-first, form-heavy, and require
  typing an address rather than pointing at a map.
- There's no confirmation of what happens after you submit, and no way to see
  if someone else already reported the same thing.
- Urgent issues (an active hazard, an accident) go through the same process
  as routine maintenance complaints — no triage happens up front, and no one
  is actually dispatched.

## What did we change?

- A 3-category, multi-issue flow (Road Problem / Road Corruption / Road
  Emergency) that takes under a minute: pick every issue type that applies
  (e.g. "Accident" + "Fire hazard" on one report), add a photo and a couple
  of lines, drop a pin on a map (reverse-geocoded address, "use my current
  location"), submit.
- Real-time AI triage on every submission — severity, suggested department,
  and a formal one-line summary — shown to the citizen immediately.
- **Live emergency dispatch**: filing an emergency report finds the nearest
  available response team of every required type and pushes them a
  notification; the team's own web dashboard shows the job with a map, a
  one-tap "Navigate," and "Mark completed" when done.
- A staff admin dashboard: search by report ID/description/address/reporter,
  filter by category/status/time/location, update status, and see or change
  which team is assigned to an emergency — plus a separate page to provision
  new response teams (admin picks the team's own ID/passcode and its city).
- A public "Ongoing Reports" feed with search, filters, and upvoting, so
  duplicate reports consolidate into community support instead of duplicating
  effort — plus a full detail popup (photos, AI triage, an embedded map of the
  exact location) available to citizens, admins, and response teams alike.
- A personal dashboard tracking each report's status
  (Submitted → In Review → In Progress → Resolved), with dynamic homepage
  stats computed live from real report counts rather than hardcoded numbers.

## Why is this version better?

It's faster to file (under a minute, on a phone, in Hindi or English), honest
about what happens next (visible AI triage and live dispatch status instead
of a black box), and it treats urgency as a first-class signal — an emergency
report doesn't just get logged, it actually finds and notifies the nearest
real response team.

## What works today, and what is still mocked?

**Works live, end-to-end, against a real Firebase backend:**
- The full 3-category, multi-issue reporting flow, including the Leaflet map
  picker with real OpenStreetMap reverse geocoding.
- AI-assisted triage via a real OpenAI API call (`api/triage.js`,
  `gpt-4o-mini`), server-side only — falls back to a rule-based mock if no
  API key is configured, so the journey still completes without one.
- **Emergency dispatch**: a Vercel serverless function (`api/dispatch.js`)
  matches every emergency report to the nearest `available` response team(s)
  by real distance to seeded/admin-created team locations, marks them busy,
  and (if a push token is registered) sends a Firebase Cloud Messaging
  notification — this is a real matching and status system, not a simulated
  countdown.
- The response-team web dashboard (`/team`) — receives the live job, shows an
  embedded map and AI triage summary, marks jobs complete.
- The admin dashboard (`/admin`) — search/filter/status-update on every real
  report, plus seeing and reassigning which team is on an emergency.
- Response team management (`/admin/teams`, `/admin/teams/new`) — a real
  Firestore-backed roster; admins choose each team's ID, passcode, and base
  city themselves.
- The community feed (search/filter/sort/upvote), personal dashboard, and
  report detail popup with map.
- Firebase Auth/Firestore as the real backend when configured (the app also
  runs on a local in-memory/localStorage mock with zero setup for fast
  demoing — see `src/lib/mockBackend.js`).

**Explicitly mocked, not real:**
- Identity verification: a simulated Aadhaar/DigiLocker-style ID → OTP →
  profile flow. No real Aadhaar, DigiLocker, or UIDAI system is contacted, and
  no real government data is requested, transmitted, or stored anywhere in
  this codebase.
- Admin and response-team sign-in are shared passcode gates, not a real
  per-person identity/role system — anyone who knows the admin passcode or a
  team's credentials can act as that role. Firestore's security rules
  document this limitation explicitly (see `firestore.rules`).
- The "arriving in X:XX" countdown shown to the citizen is a client-side
  estimate from the category's promised response window, not a real ETA fed
  by the dispatched team's live location. The UI tells users to call 112
  directly for real emergencies.

## How could this work safely at a larger scale?

- Replace the simulated auth with real DigiLocker OAuth (the UI is already
  structured as a method choice between Aadhaar-OTP and DigiLocker redirect,
  so swapping the DigiLocker branch for a real OAuth flow is a contained
  change).
- Replace the admin/team passcode gates with real per-person accounts and
  Firebase custom claims, so `firestore.rules` can check "is a verified
  admin/team member" instead of "is any authenticated user."
- Put a human moderation queue in front of AI triage output before it routes
  to a real department — the model assists prioritization, it shouldn't be
  the final authority on what a municipal team acts on.
- Rate-limit and deduplicate by geohash + category before creating a new
  report, rather than relying only on upvoting existing ones.
- Feed the dispatched team's live GPS location into the citizen-facing ETA
  instead of a static per-category estimate, and connect the emergency path
  to real municipal/112 dispatch infrastructure where it exists.
- Move photo handling and Firestore security rules through a formal privacy
  review before handling real citizen-submitted photos/locations at scale.
