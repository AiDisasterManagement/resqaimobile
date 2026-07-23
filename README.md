# ResQAI 2.0 — Mobile app (Expo scaffold)

A working React Native + Expo app wired to every endpoint in `resqai-backend`.
Navigation, API client, and all five screens are real and validated (see
"What's actually been verified" below) — the parts that are genuinely
stubbed are noted per-screen.

## Screens

| Tab | Screen | Talks to |
|---|---|---|
| SOS | Rescue request: photo (camera or library), location, vulnerability form | `POST /upload-photo`, `POST /damage-assessment`, `POST /risk-score` |
| Shelters | Ranked shelter list + evacuation route | `POST /shelters/recommend`, `POST /route` |
| Queue | Responder priority queue + resource allocation (optimized vs. naive) | `GET /seed-data`, `POST /rescue-priority-queue`, `POST /resource-allocation` |
| Assistant | Grounded explanation for a risk score or shelter pick | `POST /assistant/explain` |
| Guide | Static offline first-aid / safety content | none — works with zero connectivity by design |

Settings (gear icon on the SOS screen) lets you set the backend's LAN IP at
runtime, since this changes every time you demo on a different network.

## Quickest way to run this (recommended for teammates)

The app already points at the live backend by default — no Firebase, no
Render, nothing to configure. Just run the setup script for your OS:

- **Windows:** double-click `setup_windows.bat` (or run it from Command
  Prompt)
- **Mac/Linux:** `bash setup_mac_linux.sh`

It installs dependencies and starts Expo automatically, and handles the
"zip created a folder inside a folder" issue on its own. Skip to
"Scanning the QR code" below once it's running.

## Running it manually


```bash
cd resqai-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone (same Wi-Fi network as the
laptop running the backend), or press `a`/`i` for an emulator.

**Before anything works**, start the backend on the same network and set
its IP in the app's Settings tab:
```bash
cd resqai-backend
uvicorn app.main:app --host 0.0.0.0 --reload
```
`--host 0.0.0.0` is required — the default `127.0.0.1` only accepts
connections from the same machine, which a phone is not.

## What's actually been verified in this sandbox

This environment can't run an iOS/Android simulator or a physical device, so
the app has not been visually tested. What *was* verified:

- `npx tsc --noEmit` passes clean — no type errors across the whole app.
- `npx expo export -p android` successfully bundled the entire app via Metro
  (891 modules, every screen, every import) with zero errors. This proves
  the code is syntactically and structurally correct and every import
  resolves — it does not prove the UI looks or behaves correctly on a
  device, which still needs a real run-through.
- `expo-doctor` flagged and we fixed three missing peer dependencies
  (`expo-constants`, `expo-linking`, `expo-font`) that `expo-router` and
  `@expo/vector-icons` need at runtime but that Metro bundling alone
  doesn't catch.

**Please do a real device/emulator run-through before demo day** — layout,
touch targets, and permission prompts (camera, location) can only be
checked on an actual device.

## Known placeholders / next steps

- **Location <-> grid coordinate mapping**: done (Day 4) — see
  `src/utils/geo.ts`. Real lat/lng linearly maps onto the backend's grid
  within a configured `DEMO_AREA` bounding box (currently centered on
  Rawalpindi/Islamabad, Pakistan). **Update `DEMO_AREA` in that file to
  match wherever you're actually demoing** — this is the one thing that
  needs to change per location; everything else adapts automatically.
- **Shared location state**: done (Day 4) — see `src/state/location.ts`.
  SOS, Shelters, and Assistant screens all read/write the same location
  now. Setting your real location on the SOS tab immediately updates what
  Shelters and Assistant use too.
- **Shelters screen routing**: done (Day 10) — `/shelters/recommend` now
  returns each shelter's real `x`/`y` grid coordinates, and the "Route me
  here" button uses them directly instead of a placeholder. Verified live:
  the backend response includes correct coordinates matching the seed
  data, and the app compiles/bundles cleanly with the change.
- **Persisted settings**: done (Day 5) — the backend URL is now saved via
  `AsyncStorage` (see `src/config/apiBaseUrl.ts`) and survives an app
  restart. Loaded once on startup in `app/_layout.tsx`.
- **SOS submission now persists**: done (Day 5) — the SOS screen calls
  `POST /rescue-requests`, which actually writes to Firestore, not just
  scores locally. The result card tells you whether it was really saved
  (`persisted: true/false`) — if the backend can't reach the database, it
  still returns a valid score but flags that responders won't see it yet.
- **No offline queueing**: if the SOS screen submits with no connectivity,
  it currently just shows an error. A real disaster app should queue the
  request locally and retry once connectivity returns.
