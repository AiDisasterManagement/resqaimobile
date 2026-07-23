import { useEffect, useState } from "react";
import { GridPosition, latLngToGrid, isWithinDemoArea, DEMO_AREA } from "../utils/geo";

/**
 * Single source of truth for "where the user is," shared across the SOS,
 * Shelters, and Assistant screens. Before this existed, each screen used
 * its own location independently -- SOS captured real GPS, while Shelters
 * and Assistant each hardcoded their own separate demo coordinate. That
 * meant "find shelters near me" wasn't actually near where you said you
 * were on the SOS screen.
 *
 * Same in-memory-only pattern as apiBaseUrl.ts (see that file for why:
 * kept dependency-light, swap in AsyncStorage later if this needs to
 * persist across app restarts).
 */

export type LocationSource = "gps" | "demo" | "manual";

export interface SharedLocation {
  grid: GridPosition;
  source: LocationSource;
  /** Real coordinates, when available (not set for the demo default). */
  raw?: { latitude: number; longitude: number };
  /** True if a real GPS reading landed outside DEMO_AREA and got clamped. */
  outOfDemoArea?: boolean;
}

// Sensible default so Shelters/Assistant work even before anyone visits
// the SOS tab and grants location permission -- same spot used as the
// previous per-screen hardcoded demo location.
const DEFAULT_LOCATION: SharedLocation = {
  grid: { x: 2.5, y: 1.5 },
  source: "demo",
};

let currentLocation: SharedLocation = DEFAULT_LOCATION;
const listeners = new Set<(loc: SharedLocation) => void>();

function notify() {
  listeners.forEach((listener) => listener(currentLocation));
}

export function getSharedLocation(): SharedLocation {
  return currentLocation;
}

export function setLocationFromGPS(latitude: number, longitude: number): void {
  currentLocation = {
    grid: latLngToGrid(latitude, longitude),
    source: "gps",
    raw: { latitude, longitude },
    outOfDemoArea: !isWithinDemoArea(latitude, longitude),
  };
  notify();
}

export function setLocationManually(x: number, y: number): void {
  currentLocation = { grid: { x, y }, source: "manual" };
  notify();
}

export function resetToDemoLocation(): void {
  currentLocation = DEFAULT_LOCATION;
  notify();
}

/** Hook so any screen re-renders when the shared location changes. */
export function useSharedLocation(): SharedLocation {
  const [loc, setLoc] = useState(currentLocation);
  useEffect(() => {
    const listener = (newLoc: SharedLocation) => setLoc(newLoc);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return loc;
}

export { DEMO_AREA };
