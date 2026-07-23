import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { api, ApiError } from "../api/client";
import { useApiBaseUrl } from "../config/apiBaseUrl";
import { colors, spacing, radius } from "../theme";

type Status = "checking" | "connected" | "error";

/**
 * Every screen mounts this so it's always visible whether the backend is
 * reachable -- important because this app talks to a FastAPI server running
 * on a laptop over LAN, which is the #1 source of "nothing works" during a
 * demo (wrong IP, different Wi-Fi network, backend not started, etc).
 */
export function ConnectionBanner() {
  const [baseUrl] = useApiBaseUrl();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string>("");

  const check = useCallback(async () => {
    setStatus("checking");
    try {
      await api.health();
      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Unknown connection error.");
    }
  }, [baseUrl]);

  useEffect(() => {
    check();
  }, [check]);

  if (status === "connected") {
    return (
      <View style={[styles.banner, styles.ok]}>
        <Text style={styles.okText}>Connected to backend at {baseUrl}</Text>
      </View>
    );
  }

  if (status === "checking") {
    return (
      <View style={[styles.banner, styles.checking]}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={styles.checkingText}>Checking backend connection...</Text>
      </View>
    );
  }

  return (
    <Pressable style={[styles.banner, styles.error]} onPress={check}>
      <Text style={styles.errorText}>Backend unreachable at {baseUrl}</Text>
      <Text style={styles.errorSubtext}>{message} Tap to retry, or fix the URL in Settings.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  ok: { backgroundColor: "#123B2E" },
  okText: { color: colors.success, fontSize: 13 },
  checking: { backgroundColor: colors.surfaceAlt },
  checkingText: { color: colors.textMuted, fontSize: 13 },
  error: { backgroundColor: "#3B1414", flexDirection: "column", alignItems: "flex-start" },
  errorText: { color: colors.critical, fontSize: 13, fontWeight: "600" },
  errorSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
