/**
 * geo.ts - converts real GPS coordinates into the backend's simplified
 * local grid units (0 to GRID_SIZE-1 on each axis, see
 * resqai-backend/app/data.py: GRID_SIZE = 8).
 *
 * The backend's grid isn't tied to real-world coordinates -- it's an
 * abstract demo grid. To make "use my location" produce something
 * meaningful rather than the previous placeholder (`lat * 1000 % 8`,
 * which produced near-random, discontinuous positions), this maps a real
 * bounding box onto that grid linearly: two people standing near each
 * other in real life now end up near each other on the grid too, and
 * moving in one direction in real life moves you consistently in one
 * direction on the grid.
 *
 * DEMO_AREA covers all of Pakistan, since team members test from
 * different cities. Narrow this to one city's bounding box later if you
 * want grid distances to correspond to something more meaningful (e.g.
 * "1 grid unit" ~ a specific real distance) for a single-location demo.
 */

import { GRID_SIZE } from "./gridConfig";

export const DEMO_AREA = {
  name: "Pakistan (widened to cover the whole country -- team members are testing from different cities)",
  // Real bounding box for Pakistan. Widening this doesn't hurt precision
  // for demo purposes -- the backend's grid is abstract either way, this
  // just controls how real-world distance maps to grid distance. If you
  // later want tighter, more meaningful distances on the grid (e.g. so
  // "1 grid unit" means something closer to "1 km" for a specific city
  // demo), narrow this back down to that one city's bounding box instead.
  minLat: 23.5,
  maxLat: 37.1,
  minLng: 60.5,
  maxLng: 77.8,
};

export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Maps real lat/lng into grid units. Clamps to the grid bounds so a
 * position outside DEMO_AREA still lands at the nearest edge instead of
 * wrapping or going negative (wrapping was the bug in the old modulo
 * approach -- two nearby real-world points could land on opposite sides
 * of the grid).
 */
export function latLngToGrid(latitude: number, longitude: number): GridPosition {
  const latFrac = clamp01((latitude - DEMO_AREA.minLat) / (DEMO_AREA.maxLat - DEMO_AREA.minLat));
  const lngFrac = clamp01((longitude - DEMO_AREA.minLng) / (DEMO_AREA.maxLng - DEMO_AREA.minLng));

  return {
    // Backend's y-axis increases downward in the seed data's mental model
    // (matches how the shelters/hazard grid was authored); latitude
    // increasing (further north) maps to a lower y, i.e. "up" the grid.
    x: round1(lngFrac * (GRID_SIZE - 1)),
    y: round1((1 - latFrac) * (GRID_SIZE - 1)),
  };
}

/** Returns true if a real coordinate actually falls inside the demo area,
 * so the UI can tell the user their real position is out of range rather
 * than silently clamping them to an edge. */
export function isWithinDemoArea(latitude: number, longitude: number): boolean {
  return (
    latitude >= DEMO_AREA.minLat &&
    latitude <= DEMO_AREA.maxLat &&
    longitude >= DEMO_AREA.minLng &&
    longitude <= DEMO_AREA.maxLng
  );
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
