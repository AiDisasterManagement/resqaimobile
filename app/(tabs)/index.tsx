import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { colors, spacing, radius } from "../../src/theme";
import { useSharedLocation, setLocationFromGPS } from "../../src/state/location";
import LiveMap from "../../src/components/LiveMap";

// Center of the demo area (Pakistan), used until a real GPS fix comes in.
const DEMO_CENTER = { latitude: 30.3, longitude: 69.15 };

const CONTACTS = [
  { name: "Sarah M.", initials: "SM" },
  { name: "Officer John", initials: "OJ" },
  { name: "Emily W.", initials: "EW" },
  { name: "Dr. Mili", initials: "DM" },
];

export default function HomeScreen() {
  const router = useRouter();
  const location = useSharedLocation();
  const [locating, setLocating] = useState(false);

  async function refreshLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location permission denied", "Enable location access in settings to use your real position.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocationFromGPS(pos.coords.latitude, pos.coords.longitude);
    } catch {
      Alert.alert("Couldn't get location", "Still using the last known position.");
    } finally {
      setLocating(false);
    }
  }

  // Contacts, Call, and Voice Note are visual placeholders for now -- the
  // backend has no contacts/calling endpoints yet. Location is real.
  function notWiredYet(feature: string) {
    Alert.alert(feature, "This isn't wired up to a real feature yet -- it's a visual placeholder for now.");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* SOS hero -- opens the full detailed request form */}
      <View style={styles.sosWrap}>
        <View style={styles.sosOuter}>
          <Pressable style={styles.sosCircle} onPress={() => router.push("/sos-form")}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubtext}>Tap to Alert</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickAction icon="call" label="Call" onPress={() => notWiredYet("Call")} />
        <QuickAction icon="location" label="Location" onPress={refreshLocation} loading={locating} />
        <QuickAction icon="mic" label="Voice Note" onPress={() => notWiredYet("Voice Note")} />
      </View>

      {/* Emergency contacts */}
      <View style={styles.sectionHeadRow}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <Pressable onPress={() => notWiredYet("Contacts")}>
          <Text style={styles.sectionLink}>View All</Text>
        </Pressable>
      </View>
      <View style={styles.contactsRow}>
        {CONTACTS.map((c) => (
          <Pressable key={c.name} style={styles.contactItem} onPress={() => notWiredYet(`Call ${c.name}`)}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactInitials}>{c.initials}</Text>
              <View style={styles.contactCallBadge}>
                <Ionicons name="call" size={10} color="#fff" />
              </View>
            </View>
            <Text style={styles.contactName}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Current location */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeadRow}>
          <View style={styles.locationTitleRow}>
            <Ionicons name="location-sharp" size={16} color={colors.accent} />
            <Text style={styles.locationTitle}>Current Location</Text>
          </View>
          <Pressable style={styles.refreshPill} onPress={refreshLocation}>
            <Text style={styles.refreshText}>{locating ? "Locating..." : "Refresh"}</Text>
            <Ionicons name="refresh" size={12} color={colors.accent} />
          </Pressable>
        </View>

        {location.source === "gps" && location.raw ? (
          <Text style={styles.locationDetail}>
            {location.raw.latitude.toFixed(4)}, {location.raw.longitude.toFixed(4)}
            {location.outOfDemoArea ? " (outside demo area, clamped for scoring)" : ""}
          </Text>
        ) : (
          <Text style={styles.locationDetail}>
            Demo position (grid {location.grid.x.toFixed(1)}, {location.grid.y.toFixed(1)}) -- tap Refresh to use your real GPS location
          </Text>
        )}

        <View style={styles.mapBox}>
          <LiveMap
            latitude={location.source === "gps" && location.raw ? location.raw.latitude : DEMO_CENTER.latitude}
            longitude={location.source === "gps" && location.raw ? location.raw.longitude : DEMO_CENTER.longitude}
            approximate={!(location.source === "gps" && location.raw)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  loading,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <Ionicons name={loading ? "sync" : icon} size={22} color={colors.accent} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },

  sosWrap: { alignItems: "center", marginBottom: spacing.xl },
  sosOuter: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sosCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.accentGlow,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: `0 0 50px ${colors.accentGlow}` },
      default: {
        shadowColor: colors.accent,
        shadowOpacity: 0.6,
        shadowRadius: 25,
        elevation: 10,
      },
    }),
  },
  sosText: { color: colors.text, fontSize: 34, fontWeight: "800", letterSpacing: 1.5 },
  sosSubtext: { color: colors.textMuted, fontSize: 13, marginTop: 4 },

  quickRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  quickLabel: { color: colors.text, fontSize: 12 },

  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  sectionLink: { color: colors.accent, fontSize: 13, fontWeight: "600" },

  contactsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
  contactItem: { alignItems: "center", width: 64 },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  contactInitials: { color: "#fff", fontWeight: "700", fontSize: 14 },
  contactCallBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
  contactName: { color: colors.textMuted, fontSize: 10, textAlign: "center" },

  locationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  locationHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  locationTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  locationTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  refreshPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.lg,
  },
  refreshText: { color: colors.accent, fontSize: 11, fontWeight: "600" },
  locationDetail: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  mapBox: {
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
});
