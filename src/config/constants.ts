/**
 * Backend connection config.
 *
 * The backend is deployed live on Render (see resqai-backend/CLOUD_DEPLOY.md),
 * so this points there by default -- anyone opening the app for the first
 * time is already connected, no manual Settings step needed.
 *
 * Note: the free Render tier sleeps after 15 minutes of inactivity. The
 * first request after that takes 30-60 seconds to wake it back up -- if
 * the app looks stuck/disconnected on first launch, that's why, just wait.
 *
 * If you ever need to point at a local backend instead (e.g. testing an
 * unreleased backend change), use the Settings tab to switch to your
 * laptop's LAN IP, e.g. http://192.168.1.42:8000 -- not "localhost", since
 * a physical phone is a separate device on the network. Android emulators
 * use 10.0.2.2 to mean "the host machine".
 */
export const DEFAULT_API_BASE_URL = "https://resqai-mo5m.onrender.com";
