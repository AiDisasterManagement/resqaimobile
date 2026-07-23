import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { ConnectionBanner } from "../../src/components/ConnectionBanner";
import { Card, SectionTitle, PrimaryButton } from "../../src/components/Common";
import { api, ApiError } from "../../src/api/client";
import type { RescuePriorityOut, AllocationResponse } from "../../src/api/types";
import { colors, spacing } from "../../src/theme";

export default function QueueScreen() {
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<RescuePriorityOut[]>([]);
  const [allocation, setAllocation] = useState<AllocationResponse | null>(null);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    setAllocation(null);
    try {
      const seed = await api.seedData();
      const res = await api.rescuePriorityQueue({ requests: seed.rescue_requests });
      setQueue(res.queue);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the priority queue.");
    } finally {
      setLoading(false);
    }
  }

  async function runAllocation() {
    setAllocating(true);
    setError(null);
    try {
      const seed = await api.seedData();
      const res = await api.resourceAllocation({ requests: seed.rescue_requests, compare_baseline: true });
      setAllocation(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not run resource allocation.");
    } finally {
      setAllocating(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <ConnectionBanner />

      <Card>
        <SectionTitle>Rescue priority queue</SectionTitle>
        <Text style={styles.hint}>
          Loads the seed rescue requests from the backend, scores each one through
          Risk Assessment + Damage Assessment, and sorts by priority.
        </Text>
        <PrimaryButton title="Load priority queue" onPress={loadQueue} loading={loading} />
      </Card>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {queue.map((r, i) => (
        <Card key={r.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <Text style={styles.priority}>priority {r.priority_score.toFixed(2)}</Text>
          </View>
          <Text style={styles.detail}>{r.id}</Text>
          <Text style={styles.detail}>
            risk {r.risk_score.toFixed(2)} · damage severity {r.damage_severity.toFixed(2)}
          </Text>
        </Card>
      ))}

      <Card>
        <SectionTitle>Resource allocation</SectionTitle>
        <Text style={styles.hint}>
          Assigns volunteers to requests using the Hungarian algorithm, and compares
          against a naive first-come-first-served baseline.
        </Text>
        <PrimaryButton title="Run allocation" onPress={runAllocation} loading={allocating} />
      </Card>

      {allocation && (
        <>
          <Card>
            <SectionTitle>Optimized</SectionTitle>
            {allocation.optimized.assignments.map((a) => (
              <Text key={a.request_id} style={styles.detail}>
                {a.request_id} -&gt; {a.volunteer_name} ({a.distance_km} km, priority {a.priority_score.toFixed(2)})
              </Text>
            ))}
            {allocation.optimized.unmet_requests.length > 0 && (
              <Text style={styles.unmet}>
                Unmet: {allocation.optimized.unmet_requests.join(", ")}
              </Text>
            )}
          </Card>

          {allocation.naive_baseline && (
            <Card>
              <SectionTitle>Naive baseline (for comparison)</SectionTitle>
              {allocation.naive_baseline.assignments.map((a) => (
                <Text key={a.request_id} style={styles.detail}>
                  {a.request_id} -&gt; {a.volunteer_name} ({a.distance_km} km, priority {a.priority_score.toFixed(2)})
                </Text>
              ))}
              {allocation.naive_baseline.unmet_requests.length > 0 && (
                <Text style={styles.unmet}>
                  Unmet: {allocation.naive_baseline.unmet_requests.join(", ")}
                </Text>
              )}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  errorCard: { backgroundColor: "#3B1414", borderColor: colors.critical },
  errorText: { color: colors.critical, fontSize: 13 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  rank: { color: colors.accent, fontWeight: "700" },
  priority: { color: colors.text, fontWeight: "600" },
  detail: { color: colors.textMuted, fontSize: 12, marginBottom: 2 },
  unmet: { color: colors.warning, fontSize: 12, marginTop: spacing.xs },
});
