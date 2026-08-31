import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Switch,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { ConnectionBanner } from "../src/components/ConnectionBanner";
import { Card, SectionTitle, PrimaryButton } from "../src/components/Common";
import { api, ApiError } from "../src/api/client";
import type { Mobility } from "../src/api/types";
import { colors, spacing, radius } from "../src/theme";
import { useSharedLocation, setLocationFromGPS } from "../src/state/location";
import { generateUuid } from "../src/utils/uuid";
import { enqueueOfflineRequest, useOfflineQueue } from "../src/state/offlineQueue";

const MOBILITY_OPTIONS: Mobility[] = ["able", "injured", "wheelchair", "bedridden"];

export default function SosScreen() {
  const router = useRouter();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const location = useSharedLocation();
  const [locating, setLocating] = useState(false);

  const [age, setAge] = useState("30");
  const [mobility, setMobility] = useState<Mobility>("able");
  const [medicalNeeds, setMedicalNeeds] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const [result, setResult] = useState<{
    id: string | null;
    persisted: boolean;
    riskScore: number;
    riskLevel: string;
    damageSeverity: number;
    damageSeverityLabel?: string;
    priorityScore: number;
    explanation?: string;
  } | null>(null);

  const { queueLength, flushing, retryNow } = useOfflineQueue();

  // Day 6: stable per form-fill, sent with the submission so a retry
  // (this button again, or the offline queue reconnecting) is recognized
  // by the backend as the same request instead of creating a duplicate.
  // Regenerated only after a successful, non-duplicate submission, since
  // at that point the user would be starting a genuinely new request.
  const [clientRequestId, setClientRequestId] = useState<string>(() => generateUuid());

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission was denied.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission was denied.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function useMyLocation() {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Location permission was denied.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocationFromGPS(pos.coords.latitude, pos.coords.longitude);
    } catch (err) {
      setError("Could not get location. Shelters/Assistant will keep using the last known position.");
    } finally {
      setLocating(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setQueued(false);
    setResult(null);

    const vulnerability = {
      age: parseInt(age, 10) || 30,
      mobility,
      medical_needs: medicalNeeds,
    };

    try {
      let imagePath: string | undefined;
      if (photoUri) {
        try {
          const uploaded = await api.uploadPhoto(photoUri);
          imagePath = uploaded.image_path;
        } catch {
          // Photo upload failed (likely the same connectivity issue that
          // would otherwise hit the submission below) -- don't let a
          // missing photo block an emergency request. Falls through to
          // the image_label default just below.
        }
      }

      const payload = {
        x: location.grid.x,
        y: location.grid.y,
        vulnerability,
        ...(imagePath ? { image_path: imagePath } : { image_label: "minor_debris" }),
        client_request_id: clientRequestId,
      };

      // Real submission -- this persists to the backend's database, so the
      // request actually shows up on the responder Queue tab (on any
      // device), not just a local score shown to this one citizen.
      const res = await api.submitRescueRequest(payload);

      setResult({
        id: res.id,
        persisted: res.persisted,
        riskScore: res.risk_score,
        riskLevel: res.risk_level,
        damageSeverity: res.damage_severity,
        damageSeverityLabel: res.damage_severity_label,
        priorityScore: res.priority_score,
        explanation: res.explanation,
      });

      // Start a fresh request id for the next submission, but only once
      // this one is confirmed to have actually gone through.
      if (res.persisted) {
        setClientRequestId(generateUuid());
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        // No connectivity, not a server rejection -- save it locally
        // instead of losing an emergency request. It'll retry
        // automatically next app open, or via "Retry now" below, using
        // this same clientRequestId so it can't be double-counted.
        await enqueueOfflineRequest(clientRequestId, {
          x: location.grid.x,
          y: location.grid.y,
          vulnerability,
          image_label: photoUri ? undefined : "minor_debris",
          client_request_id: clientRequestId,
        });
        setQueued(true);
        setClientRequestId(generateUuid());
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong submitting the request.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Submit a rescue request</Text>
        <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <ConnectionBanner />

      <Card>
        <SectionTitle>Photo (optional)</SectionTitle>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.hint}>
            Add a photo of the damage so the AI Damage Assessment model can factor
            severity into your priority score.
          </Text>
        )}
        <View style={styles.row}>
          <Pressable style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryButtonText}>Take photo</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={pickPhoto}>
            <Text style={styles.secondaryButtonText}>Choose from library</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <SectionTitle>Location</SectionTitle>
        <Text style={styles.hint}>
          Grid position ({location.grid.x.toFixed(1)}, {location.grid.y.toFixed(1)})
          {location.source === "demo" ? " -- demo default, tap below to use your real location" : ""}
          {location.source === "gps" ? " -- from your real location" : ""}
        </Text>
        {location.source === "gps" && location.outOfDemoArea && (
          <Text style={styles.warnText}>
            Your real position is outside the configured demo area, so this was
            clamped to the nearest edge of the grid. Update DEMO_AREA in
            src/utils/geo.ts to match wherever you're actually demoing.
          </Text>
        )}
        <PrimaryButton title="Use my location" onPress={useMyLocation} loading={locating} />
      </Card>

      <Card>
        <SectionTitle>About you</SectionTitle>
        <Text style={styles.label}>Age</Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Text style={styles.label}>Mobility</Text>
        <View style={styles.chipRow}>
          {MOBILITY_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setMobility(opt)}
              style={[styles.chip, mobility === opt && styles.chipActive]}
            >
              <Text style={[styles.chipText, mobility === opt && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Medical needs</Text>
          <Switch value={medicalNeeds} onValueChange={setMedicalNeeds} />
        </View>
      </Card>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {queued && (
        <Card style={styles.queuedCard}>
          <SectionTitle>Saved -- will send when back online</SectionTitle>
          <Text style={styles.warnText}>
            No connection right now, so this request was saved on your phone. It'll
            submit automatically next time you open the app, or tap "Retry now" below.
          </Text>
        </Card>
      )}

      {queueLength > 0 && (
        <Card>
          <SectionTitle>
            {queueLength} request{queueLength === 1 ? "" : "s"} waiting to send
          </SectionTitle>
          <Text style={styles.hint}>
            These didn't go through yet due to no connection. They won't be
            duplicated once they do.
          </Text>
          <PrimaryButton title="Retry now" onPress={retryNow} loading={flushing} />
        </Card>
      )}

      <PrimaryButton title="Submit request" onPress={submit} loading={submitting} />

      {result && (
        <Card style={{ marginTop: spacing.md }}>
          <SectionTitle>
            {result.persisted ? "Request submitted" : "Scored, but not saved"}
          </SectionTitle>
          {result.persisted ? (
            <Text style={styles.successText}>
              Your request is now in the responder queue{result.id ? ` (ID: ${result.id})` : ""}.
            </Text>
          ) : (
            <Text style={styles.warnText}>
              The backend couldn't save this to the database right now, so responders
              won't see it yet -- but here's your score anyway.
            </Text>
          )}
          <Text style={styles.resultLine}>
            Priority score: {result.priorityScore.toFixed(2)}
          </Text>
          <Text style={styles.resultLine}>
            Risk score: {result.riskScore.toFixed(2)} ({result.riskLevel})
          </Text>
          <Text style={styles.resultLine}>
            Damage severity: {result.damageSeverity.toFixed(2)}
            {result.damageSeverityLabel ? ` (${result.damageSeverityLabel})` : ""}
          </Text>
          {result.explanation && <Text style={styles.hint}>{result.explanation}</Text>}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  successText: { color: colors.success, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "600" },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  warnText: { color: colors.warning, fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  photoPreview: {
    width: "100%",
    height: 160,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: { color: colors.text, fontSize: 13 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextActive: { color: "#fff" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorCard: { backgroundColor: "#3B1414", borderColor: colors.critical },
  queuedCard: { backgroundColor: "#2A2410", borderColor: colors.warning },
  errorText: { color: colors.critical, fontSize: 13 },
  resultLine: { color: colors.text, fontSize: 14, marginBottom: 4 },
});
