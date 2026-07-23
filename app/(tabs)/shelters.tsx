import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { ConnectionBanner } from "../../src/components/ConnectionBanner";
import { Card, SectionTitle, PrimaryButton } from "../../src/components/Common";
import { api, ApiError } from "../../src/api/client";
import type { ShelterOption, RouteResponse } from "../../src/api/types";
import { colors, spacing, radius } from "../../src/theme";
import { useSharedLocation } from "../../src/state/location";

export default function SheltersScreen() {
  const location = useSharedLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shelters, setShelters] = useState<ShelterOption[]>([]);
  const [explanation, setExplanation] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [routing, setRouting] = useState(false);

  async function findShelters() {
    setLoading(true);
    setError(null);
    setRoute(null);
    try {
      const res = await api.recommendShelters({
        x: location.grid.x,
        y: location.grid.y,
        vulnerability: { age: 30, mobility: "able", medical_needs: false },
        top_n: 3,
      });
      setShelters(res.recommendations);
      setExplanation(res.explanation);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load shelters.");
    } finally {
      setLoading(false);
    }
  }

  async function routeTo(shelter: ShelterOption) {
    setSelectedId(shelter.shelter_id);
    setRouting(true);
    setError(null);
    try {
      // Route endpoint expects integer grid coordinates 0..grid_size-1.
      const res = await api.route({
        start_x: Math.round(location.grid.x),
        start_y: Math.round(location.grid.y),
        goal_x: Math.round(shelter.x),
        goal_y: Math.round(shelter.y),
      });
      setRoute(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not compute a route.");
    } finally {
      setRouting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <ConnectionBanner />

      <Card>
        <SectionTitle>Nearest shelters</SectionTitle>
        <Text style={styles.hint}>
          Using your location: grid ({location.grid.x.toFixed(1)}, {location.grid.y.toFixed(1)})
          {location.source === "demo" ? " -- demo default, set your real location on the SOS tab" : ""}
          {location.source === "gps" ? " -- from your real location" : ""}
        </Text>
        <PrimaryButton title="Find shelters" onPress={findShelters} loading={loading} />
      </Card>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {explanation ? (
        <Card>
          <Text style={styles.explanation}>{explanation}</Text>
        </Card>
      ) : null}

      {shelters.map((s, i) => (
        <Card key={s.shelter_id}>
          <View style={styles.shelterHeader}>
            <Text style={styles.shelterRank}>#{i + 1}</Text>
            <Text style={styles.shelterName}>{s.name}</Text>
          </View>
          <Text style={styles.shelterDetail}>
            {s.distance_km} km away · {Math.round(s.occupancy_ratio * 100)}% full
            {s.at_capacity ? " · AT CAPACITY" : ""}
          </Text>
          <Text style={styles.shelterDetail}>
            Accessibility match: {s.accessibility_match} · Medical match: {s.medical_match}
          </Text>
          <Pressable
            style={styles.routeButton}
            onPress={() => routeTo(s)}
            disabled={routing && selectedId === s.shelter_id}
          >
            <Text style={styles.routeButtonText}>
              {routing && selectedId === s.shelter_id ? "Routing..." : "Route me here"}
            </Text>
          </Pressable>
        </Card>
      ))}

      {route && (
        <Card>
          <SectionTitle>Evacuation route</SectionTitle>
          {route.found ? (
            <>
              <Text style={styles.hint}>Total cost: {route.total_cost}</Text>
              <Text style={styles.hint}>
                Path: {route.path.map((p) => `(${p[0]},${p[1]})`).join(" -> ")}
              </Text>
            </>
          ) : (
            <Text style={styles.errorText}>No path found -- goal may be unreachable.</Text>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  explanation: { color: colors.text, fontSize: 13, lineHeight: 18, fontStyle: "italic" },
  errorCard: { backgroundColor: "#3B1414", borderColor: colors.critical },
  errorText: { color: colors.critical, fontSize: 13 },
  shelterHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  shelterRank: { color: colors.accent, fontWeight: "700", fontSize: 14 },
  shelterName: { color: colors.text, fontWeight: "600", fontSize: 15 },
  shelterDetail: { color: colors.textMuted, fontSize: 12, marginBottom: 2 },
  routeButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  routeButtonText: { color: colors.text, fontSize: 13 },
});
