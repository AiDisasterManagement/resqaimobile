/**
 * Must match GRID_SIZE in resqai-backend/app/data.py (and the seeded
 * road_grid document in Firestore). If the backend's grid size ever
 * changes, update this to match -- it's not fetched dynamically because
 * every screen that positions something on the grid needs it
 * synchronously, before any API call has necessarily completed.
 */
export const GRID_SIZE = 8;
