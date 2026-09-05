# Road India — Mentor Presentation Report

Prepared: 5 September 2026  
Scope: current repository implementation, not a certification of the deployed website.

Website: [road-india.vercel.app](https://road-india.vercel.app/)  
Repository: [Instigo5483/Road-India](https://github.com/Instigo5483/Road-India)

## 1. Executive summary

Road India is a mobile-first civic reporting website that connects road complaints, photographic evidence, location, administrative review, and citizen feedback in one public workflow.

Citizens can report multiple road or infrastructure problems together, attach photos, pinpoint the location, and track progress. Administrators review reports and submit completion evidence before marking them resolved. The original reporter can then rate the work and confirm or dispute the resolution.

The central idea is **accountability beyond submission**: collecting a complaint is only the beginning. People should be able to see what happened, inspect the evidence of completion, and say whether the problem was actually fixed.

AI assists initial review by suggesting severity, a department, and a short summary. Public maps, charts, and searchable archives make the report dataset inspectable. This is a functioning evaluation prototype, not an official government service, verified identity platform, or emergency-response system.

## 2. Problem and intended users

The project addresses a design problem: a road complaint is less useful when its location is unclear, evidence is missing, progress is difficult to follow, or administrative closure cannot be checked by the citizen. These are the problems the product is designed around; the project has not yet conducted a comparative study proving that every existing portal has them.

The intended users are:

- **Citizens:** file an issue, support an existing report, and track their own complaints.
- **Reviewing staff:** inspect evidence, update work stages, and document completion.
- **Community observers:** browse reports and understand geographic patterns without logging in.
- **Mentors and evaluators:** examine an end-to-end civic technology prototype and its implementation choices.

The intended benefit is clearer communication and public accountability. Faster repairs, lower administrative cost, and greater participation are hypotheses to validate in a pilot—not outcomes already measured.

## 3. Current product scope

Road damage and infrastructure complaints share one reporting flow. Users do not have to choose between separate Road Problem and Road Corruption portals.

Available issue types include potholes, waterlogging, open manholes, broken drainage, debris, damaged speed breakers, poor road quality, missing footpaths, incomplete road work, missing signs, missing streetlights, encroachment, and other issues. Multiple types can describe one report.

An infrastructure complaint is not proof of corruption. The website records the citizen's description and evidence; it does not establish wrongdoing.

The landing page and home page are the same experience. The interface is light-mode only, supports English and Hindi, and uses bottom navigation on smaller screens with desktop navigation at larger widths. Emergency dispatch and response-team functionality have been removed from the current application.

## 4. Main pages and capabilities

| Page | Purpose and important capabilities |
| --- | --- |
| Home | Unified entry point, public impact statistics, report action, and links to public information |
| Citizen login | Step-by-step simulated identity entry and OTP, followed by account-name review and preferred language |
| Report an issue | Multi-select problems, description, up to three photos, GPS/manual map location, and nearby-report suggestions |
| Ongoing Reports | Public search by ID or keyword, sorting, status/time filters, state/district/city filters, list/map views, and support counts |
| My Reports | Personal reports, live status tracking, search/filtering, eligible editing, and resolution feedback |
| Resolved Reports | Public archive, filters, completion details, citizen feedback, and average resolution time |
| View Data | Time-based metrics, interactive trends/distribution charts, location rankings, map analysis, and CSV/GeoJSON exports |
| Settings | Read-only account identity, public display preferences, optional local drafts/history, compression, export, rating, and help |
| Admin report management | Search/filter reports, review details, change non-final stages, and submit resolution proof |
| Admin analytics | Summary metrics, recent activity, location/category/status breakdowns, and the shared interactive map |

Public browsing does not require login. Reporting, personal records, and settings use citizen authentication. Admin access is available through a direct URL rather than a visible citizen-login role switcher; that separation is a navigation decision, not security.

## 5. End-to-end report lifecycle

```text
Citizen selects issues, adds evidence, and pins the location
                          |
                          v
                Submitted + AI-assisted triage
                          |
                          v
                      In Review
                          |
                          v
                     In Progress
                          |
                          v
          Admin submits completion proof -> Resolved
                          |
                          v
       Reporter rates the work and confirms or disputes it
```

These are the intended workflow stages. The non-final dropdown is not a strict sequential workflow engine: it offers Submitted, In Review, and In Progress for open reports.

### Citizen submission

The user describes the problem, selects relevant issue types, attaches up to three JPEG/PNG/WebP photos, and places a map pin. GPS can assist, but manual selection remains available. Nearby unresolved reports encourage supporting an existing complaint rather than creating a duplicate.

The report receives a unique document ID, creation time, owner reference, and initial Submitted status. AI triage is attempted as part of report creation. A failed AI request does not need to prevent filing.

### Review and work tracking

Staff can inspect the report and change its non-final status. Firebase listeners propagate changes to connected views. The citizen can edit their own report while it is Submitted or In Review, but not after work has progressed beyond those stages.

Status-change notices are in-app notifications. They are not SMS or background push notifications.

### Evidence-based closure

Resolved is not an ordinary dropdown choice. The resolution form collects an after-repair photo, inspection officer/display name, notes, optional contractor/work-order reference, and confirmation that the evidence describes completed work. A successful operation saves the proof, resolution timestamp, and Resolved status together.

An unfinished resolution form can be saved in the current tab's session storage. Older completed demo records may not have the newer proof fields.

### Citizen verification

The author can leave one review with a 1–5 star rating and confirm or dispute whether the issue was resolved. This feedback appears in report details. A disputed resolution does not currently trigger an automatic reopening/escalation workflow; administrative closure and citizen acceptance remain distinct pieces of information.

## 6. Architecture and technology choices

```text
Browser: React interface, routing, forms, maps, charts
   |
   +--> Firebase Authentication + Firestore
   |      Identity sessions, user profiles, reports, live updates
   |
   +--> Vercel /api/login --> Firebase Admin custom token
   |
   +--> Vercel /api/triage --> OpenAI --> validated triage result
   |
   +--> Map tiles / reverse geocoding

Without Firebase configuration: browser-local mock backend
```

| Technology | Role and reason for the choice |
| --- | --- |
| React 18 | Reusable components and state-driven interfaces across citizen/admin pages |
| React Router 6 | Browser navigation and route-level page separation |
| Tailwind CSS 3 | Consistent styling and responsive mobile-first layouts |
| Framer Motion | UI transitions and interaction feedback, with reduced-motion support |
| Vite 5 | Local development and optimized production bundles |
| Firebase Authentication | Authentication sessions and custom-token identity support |
| Cloud Firestore | Document storage, live listeners, and transactional updates |
| Firebase Admin SDK | Server-side custom-token generation and maintenance utilities |
| Vercel Node functions | Login/AI endpoints without maintaining a separate always-running server |
| OpenAI gpt-4o-mini | Text/photo-assisted triage in the current implementation |
| Leaflet / react-leaflet | Interactive map rendering and report markers |
| OpenStreetMap ecosystem | On-demand map tiles and location lookup |
| Node tests / ESLint | Regression checks and static code quality checks |

Shared React context providers handle authentication, reports, languages, and notifications. UI components consume those providers rather than maintaining independent copies of the report dataset.

Local development mirrors the server endpoints through Vite middleware. The production setup uses Vercel functions. A static preview alone does not execute the backend endpoints.

## 7. Database and identity design

Firestore is a document database rather than a relational database. Its document IDs serve as unique record identifiers; related records store references such as the author's UID. Relationships and validation are handled by application logic and security rules rather than SQL joins and foreign-key constraints.

The principal collections are conceptually:

```text
users/{uid}
  saved account name, test identity, preferences

reports/{reportId}
  createdBy -> user's UID
  issue types, description, photos, location
  status, createdAt, resolvedAt
  support count and voter IDs
  AI triage, resolution proof, citizen feedback
  author presentation preferences
```

The configured test-login endpoint derives a stable UID from the supplied test identifier and creates a Firebase custom token. Reusing that identifier can therefore locate the same profile instead of generating an unrelated account. The previous saved name is reused.

This requires the configured server endpoint and service credential. Anonymous-auth fallback does not guarantee repeat-account identity. Simulated DigiLocker uses a browser-local generated identifier and is not a real government OAuth connection.

**Only fictional IDs should be used.** The generated UID does not make the entire profile anonymous: the test identifier is also processed/stored as profile data. Anyone knowing a test ID can access its simulated account; there is no genuine OTP verification.

## 8. AI integration explained

The client sends selected issue types, description, and only the first attached photo to `/api/triage`. The server calls the configured OpenAI model and requests JSON containing severity, a suggested department, and a concise caseworker summary.

The application validates the expected output fields and severity values before using them. Server-side upstream calls time out after eight seconds; client requests time out after twelve seconds. Missing credentials or handled upstream failures lead to a rule-based server fallback. A client request failure can leave a report without triage.

The API key stays in the server environment, not the frontend bundle. When AI is enabled, the description and first photo are sent to the provider, which is a privacy consideration to explain to users.

The AI's role is assistance, not decision-making authority. It does not verify a photograph, prove corruption, dispatch a repair team, guarantee a repair deadline, or mark a report resolved. Suggested departments are not confirmed integrations with government agencies.

No accuracy benchmark or measured reduction in review time has been established yet. A meaningful next evaluation would compare its severity and department suggestions against human-reviewed examples.

## 9. Maps and analytics

Public and admin analytics share map controls for **Heatmap, Pins, and Both**. Data modes show reports, resolved reports, or an unresolved-versus-resolved comparison.

- Red comparison areas have more unresolved than resolved reports.
- Green areas have more resolved than unresolved reports.
- Yellow indicates equal counts.

The heatmap is an aggregated circle-density visualization using quarter-degree cells, not a continuous heat surface. Density and pin views help answer different questions: where issues concentrate and where individual reports are located.

The initial/reset view centers on India, but users can navigate worldwide. Tiles are requested as needed; enabling worldwide navigation does not download the entire world map. Invalid coordinates are excluded, so map counts can differ from overall totals.

The public analytics map follows the selected reporting period; the admin map uses the reports supplied to admin analytics. When demonstrating a time filter, explain that the selected reporting cohort is not necessarily every historical report resolved during that same period.

Average resolution time uses valid creation and resolution timestamps. Missing or invalid durations are excluded rather than treated as zero. It measures recorded closure time, not citizen-confirmed repair quality. Charts and counts describe the app's dataset—not all road conditions in India.

## 10. Privacy, usability, and resilience

Public-name preferences allow a first name/initial, anonymous label, or full saved name. These affect presentation; they do not remove underlying ownership identifiers or previously exported copies.

Optional local drafts and a bounded location history are off by default. They remain on the current device, are not encrypted, and do not submit automatically. This is draft recovery, not a fully offline application. Reporting and synchronization still require connectivity.

Other implemented safeguards include input/photo size limits, compression, request timeouts, recoverable error screens, report-list retry feedback, keyboard focus management in dialogs, and success notices shown only after operations complete. Support changes use transactions to reduce concurrent-update errors.

These measures improve reliability but do not replace a privacy review, server-side authorization, abuse controls, or accessibility testing with real users.

## 11. Optimization and verified quality

The latest maintenance pass removed 24 obsolete source/assets files and 113 unused translation entries from each language dictionary. Retired emergency/team code was removed without deleting live data or older compatible road reports.

Routes, maps, and report detail interfaces load on demand. Vendor code is separated, location grouping avoids repeated array copying, toast timers are cleaned up, and status-change notifications are mounted once.

Recorded bundle results from that audit:

| Measure | Before | After |
| --- | --- | --- |
| Main JavaScript, uncompressed | 110.91 kB | 89.13 kB |
| Main JavaScript, gzip | 37.22 kB | 31.27 kB |
| Main CSS, uncompressed | 49.64 kB | 46.19 kB |

The main JavaScript chunk is approximately 20% smaller uncompressed. This does not mean the entire website is 20% faster; no controlled page-load benchmark was performed.

The maintenance audit recorded 22 passing automated tests, clean lint, and a successful production build. Tests cover core helpers, mock persistence, timeout/fallback behavior, import reachability, and translations. Browser smoke checks covered key public/admin routes and map interactions.

API responses in tests are mocked. These results do not certify live Firebase/OpenAI behavior, every device/browser, or the security rules in an emulator. See [AUDIT.md](AUDIT.md) for the exact scope.

## 12. Limitations to disclose clearly

1. **Identity is simulated:** no UIDAI, DigiLocker, or real OTP verification.
2. **Admin authorization is prototype-only:** a client-visible evaluation passcode is not secure staff authentication. Database status/proof operations still need verified administrator-role enforcement.
3. **Rules rollout is incomplete:** the latest rule changes have not been emulator-tested or deployed by the maintenance pass.
4. **Dependency work remains:** the last audit recorded 11 advisories—10 moderate and one high. Major-version migrations need separate testing; this count is a point-in-time result.
5. **No municipal integration:** submission does not enter an official repair queue or establish an SLA.
6. **No server-side abuse protection:** duplicate/spam heuristics are client-side and can be bypassed.
7. **Storage/query scalability:** photos remain inline in Firestore and report listeners consume the collection. Larger-scale use needs a deliberate storage/query redesign.
8. **No proven civic outcomes yet:** current demo activity is not evidence of real repairs, adoption, AI accuracy, or reduced resolution times.

Positioning these honestly demonstrates engineering judgment: the prototype validates a workflow while exposing the requirements for a real deployment.

## 13. Recommended next milestones

### First: secure and validate

- Replace mock identity and shared passcodes with appropriate authentication and server-enforced roles.
- Test Firestore permissions in an isolated emulator/project, including unauthorized writes.
- Add backend rate limiting, input validation, moderation, and safe upload handling.
- Complete dependency upgrades, deployment regression tests, and a privacy review.

### Second: improve operational readiness

- Move photos to suitable object storage and adopt paginated/indexed queries.
- Add observability for failed submissions, triage errors, and database costs.
- Define an explicit disputed-resolution/reopening process and staff audit trail.
- Perform mobile, accessibility, slow-network, and real-user usability testing.

### Third: validate impact with a pilot

- Partner with an authorized local body or a clearly scoped campus/community team.
- Measure submission completion rate, time to submit, duplicate rate, and review time.
- Evaluate triage suggestions against human decisions.
- Track resolution duration, citizen-confirmation rate, and disputed closures separately.

These are proposals, not currently completed features.

## 14. Suggested mentor walkthrough: 8–10 minutes

1. **Problem and idea — 1 minute:** explain why the project focuses on the full complaint-to-confirmation loop.
2. **Citizen flow — 2 minutes:** show fictional test login, one multi-issue report, photos/location, and My Reports.
3. **Accountability — 2 minutes:** use a prepared record to demonstrate staff progress, completion proof, and citizen feedback. Do not imply a real repair occurred during the demo.
4. **Public transparency — 1 minute:** show ongoing/resolved feeds and switch between density and pins on analytics.
5. **Architecture — 1–2 minutes:** explain React, Firestore listeners, server endpoints, and AI fallback using the diagram above.
6. **Trade-offs and feedback — 1–2 minutes:** distinguish mocks from real integrations, share test evidence, and discuss the next milestone.

## 15. Questions a mentor may ask

**What makes it different?**  
The distinguishing product choice is combining evidence-based reporting, public tracking, completion proof, and reporter confirmation in one workflow. It is not a claim that no other product has similar features.

**Why use AI?**  
To prepare a consistent initial severity/department/summary suggestion from unstructured text and a photo. Human review remains necessary, and usefulness must be measured.

**Why Firebase rather than SQL?**  
The prototype benefits from document-oriented records and live listeners. SQL could also work, especially for more relational operational reporting; Firebase was a delivery trade-off, not a claim of universal superiority.

**What happens when AI is down?**  
The server can return rule-based triage; the report may also proceed without triage when the client request fails.

**How do you know an issue is really fixed?**  
The admin supplies evidence and the reporter can confirm or dispute it. This improves inspectability, but does not independently authenticate the photo or guarantee work quality.

**Can it handle a city-wide launch today?**  
Not responsibly without additional security, privacy, storage/query, abuse-prevention, integration, and load testing work.

**Is the demo data evidence of impact?**  
No. It demonstrates functioning interfaces and calculations. Real-world impact requires a monitored pilot with authorized participants.

## 16. Opening statement you can say aloud

> Road India is a mobile-first website that makes road complaints traceable from submission to resolution. A citizen can describe multiple issues, attach photos, and pinpoint the location. AI helps prepare an initial review summary, while public feeds show progress. An administrator supplies completion evidence before closing the report, and the citizen can then confirm or dispute the result. I built it with React, Firebase, interactive maps, and server-side AI endpoints. The prototype demonstrates the reporting and accountability workflow; identity and administrator access are still evaluation-only. My next goal is to secure those boundaries and validate the workflow with a small, authorized pilot.

## 17. Feedback to request from your mentor

- Is citizen confirmation the right primary measure of successful closure?
- Which single organization or community would provide the most realistic first pilot?
- What minimum security/privacy requirements should be met before collecting real reports?
- Which AI task should be evaluated first: severity, department suggestion, or summarization?
- Should the next milestone prioritize pilot readiness, operational integration, or scaling?

Supporting references: [README](README.md), [submission notes](SUBMISSION.md), and [maintenance audit](AUDIT.md). This report was prepared from local documentation and source code; it does not assert that the public deployment contains every latest local change.
