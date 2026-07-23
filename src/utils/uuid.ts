/**
 * Minimal UUID v4 generator with no external dependency (no `uuid`
 * package, no expo-crypto). Good enough for a client-generated dedup
 * key -- it never needs to be cryptographically unpredictable, just
 * unique per submission attempt.
 */
export function generateUuid(): string {
  // RFC4122-ish v4: random hex with version/variant bits fixed.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
