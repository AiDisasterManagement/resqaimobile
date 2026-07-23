import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { ConnectionBanner } from "../../src/components/ConnectionBanner";
import { Card, SectionTitle, PrimaryButton } from "../../src/components/Common";
import { api, ApiError } from "../../src/api/client";
import { colors, spacing, radius } from "../../src/theme";
import { useSharedLocation } from "../../src/state/location";

export default function AssistantScreen() {
  const location = useSharedLocation();
  const [context, setContext] = useState<"risk" | "shelter">("risk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const res = await api.assistantExplain({
        context,
        x: location.grid.x,
        y: location.grid.y,
        vulnerability: { age: 30, mobility: "able", medical_needs: false },
      });
      setExplanation(res.explanation);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <ConnectionBanner />

      <Card>
        <SectionTitle>Ask the emergency assistant</SectionTitle>
        <Text style={styles.hint}>
          Explanations are grounded in the same numbers the Risk Assessment and
          Shelter Recommendation engines used -- not generic disaster advice. This
          is currently a deterministic stand-in for a real LLM call (see the
          backend README); the UI contract stays the same either way.
        </Text>
        <Text style={styles.locationHint}>
          Using grid ({location.grid.x.toFixed(1)}, {location.grid.y.toFixed(1)})
          {location.source === "demo" ? " -- demo default, set your real location on the SOS tab" : " -- your real location"}
        </Text>

        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, context === "risk" && styles.chipActive]}
            onPress={() => setContext("risk")}
          >
            <Text style={[styles.chipText, context === "risk" && styles.chipTextActive]}>
              Why is my risk score what it is?
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, context === "shelter" && styles.chipActive]}
            onPress={() => setContext("shelter")}
          >
            <Text style={[styles.chipText, context === "shelter" && styles.chipTextActive]}>
              Why this shelter?
            </Text>
          </Pressable>
        </View>

        <PrimaryButton title="Ask" onPress={ask} loading={loading} />
      </Card>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {explanation && (
        <Card>
          <Text style={styles.explanation}>{explanation}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  locationHint: { color: colors.textMuted, fontSize: 12, fontStyle: "italic", marginBottom: spacing.md },
  chipRow: { gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: "#fff" },
  errorCard: { backgroundColor: "#3B1414", borderColor: colors.critical },
  errorText: { color: colors.critical, fontSize: 13 },
  explanation: { color: colors.text, fontSize: 14, lineHeight: 20, fontStyle: "italic" },
});
