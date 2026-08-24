# Road India — Build What Moves India submission

## Project summary (for the submission form, <250 words)

Road India lets any citizen report a pothole, a stalled road-work site, or a
live road emergency in under a minute, and tells them exactly what happens to
it next.

**The problem:** India's existing channels for road issues — municipal
helplines, PWD complaint portals, generic grievance apps — are slow to file
into (long forms, no location precision, no photo flow), give no visibility
after submission, and treat every complaint identically regardless of
urgency. A citizen reporting a life-threatening road accident goes into the
same queue as someone reporting a faded lane marking.

**What we built:** a mobile-first, pick-a-category-and-go reporting flow —
type, photo, precise map pin, done. Every report is triaged in real time by
an OpenAI model (`gpt-4o-mini`) that assesses severity, suggests the
responsible department, and writes a caseworker-ready summary — shown to the
citizen immediately, not hidden in a backend. Emergency reports get a live
"team arriving in X:XX" tracker. A public, upvotable community feed lets
citizens see what's already been reported instead of filing duplicates,
filterable by category, distance, and location.

**What's mocked:** identity verification (a simulated Aadhaar/DigiLocker OTP
flow — no real UIDAI integration) and emergency dispatch (no real dispatch
system exists anywhere). Everything else — the AI triage, the reporting
flow, the feed, the map, upvoting — runs live end-to-end.

**At scale:** swap the mock auth for real DigiLocker OAuth, add a moderation
queue in front of the AI triage output, and connect dispatch to municipal
helpline APIs where they already exist.

---

## Who is facing the problem?

Any Indian resident who has ever tried to report a road issue — a pothole
that damaged their vehicle, a road-work site left unfinished for months, or
a live accident/hazard — through an existing municipal channel and found it
slow, opaque, or simply not built for a phone.

## What is difficult about the current experience?

- Most municipal complaint portals are desktop-first, form-heavy, and require
  typing an address rather than pointing at a map.
- There's usually no confirmation of what happens after you submit, and no
  way to see if someone else already reported the same thing.
- Urgent issues (an active hazard, an accident) are handled with the same
  process as routine maintenance complaints — no triage happens up front.

## What did we change?

- A 3-category, type-specific flow (Road Problem / Road Corruption / Road
  Emergency) that takes under a minute: pick a type, add a photo and a
  couple of lines, drop a pin on a map (with reverse-geocoded address and
  "use my current location"), submit.
- Real-time AI triage on every submission — severity, suggested department,
  and a formal one-line summary — shown to the citizen, not just logged
  server-side.
- A public "Ongoing Reports" feed with search, category/location filters,
  and upvoting, so duplicate reports consolidate into community support
  instead of duplicating effort.
- A personal dashboard tracking each report's status
  (Submitted → In Review → In Progress → Resolved).
- A live countdown/status tracker specifically for emergency reports.

## Why is this version better?

It's faster to file (under a minute, on a phone, in Hindi or English), it's
honest about what happens next (visible AI triage + status tracking instead
of a black box), and it treats urgency as a first-class signal instead of
FIFO-queuing every complaint identically.

## What works today, and what is still mocked?

**Works live, end-to-end:**
- The full 3-category reporting flow, including the Leaflet map picker with
  real OpenStreetMap reverse geocoding.
- AI-assisted triage via a real OpenAI API call (`api/triage.js`), server-side
  only — falls back to a rule-based mock if no API key is configured, so the
  journey still completes without one.
- The community feed (search/filter/sort/upvote) and personal dashboard.
- Firebase Auth/Firestore/Storage as the real backend when configured (the
  app also runs on a local in-memory/localStorage mock with zero setup for
  fast demoing — see `src/lib/mockBackend.js`).

**Explicitly mocked, not real:**
- Identity verification: a simulated Aadhaar/DigiLocker-style ID → OTP →
  profile flow. No real Aadhaar, DigiLocker, or UIDAI system is contacted,
  and no real government data is requested, transmitted, or stored anywhere
  in this codebase.
- Emergency dispatch: the "team arriving in X:XX" tracker is a client-side
  countdown computed from the report's timestamp and the category's promised
  response window — no real response team, dispatch system, or emergency
  service integration exists behind it. The UI tells users to call 112
  directly for real emergencies.

## How could this work safely at a larger scale?

- Replace the simulated auth with real DigiLocker OAuth (the UI is already
  structured as a method choice between Aadhaar-OTP and DigiLocker redirect,
  so swapping the DigiLocker branch for a real OAuth flow is a contained
  change).
- Put a human moderation queue in front of AI triage output before it
  routes to a real department — the model assists prioritization, it
  shouldn't be the final authority on what a municipal team acts on.
- Rate-limit and deduplicate by geohash + category before creating a new
  report, rather than relying only on upvoting existing ones.
- Connect the emergency path to real dispatch infrastructure (municipal
  helpline APIs, 112 integration) where it exists, instead of a simulated
  countdown, with clear fallback messaging where it doesn't.
- Move photo storage and Firestore security rules through a formal privacy
  review before handling real citizen-submitted photos/locations at scale.
