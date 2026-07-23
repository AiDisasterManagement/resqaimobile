import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/theme";
import { loadPersistedApiBaseUrl } from "../src/config/apiBaseUrl";
import { initOfflineQueue } from "../src/state/offlineQueue";

export default function RootLayout() {
  useEffect(() => {
    // Day 5: load whatever backend URL was last saved, so a manually-set
    // URL (e.g. a local dev backend) actually survives an app restart
    // instead of always resetting to DEFAULT_API_BASE_URL.
    loadPersistedApiBaseUrl();
    // Day 6: retry any SOS submissions that got queued locally last time
    // the app couldn't reach the backend.
    initOfflineQueue();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", title: "Backend settings" }}
        />
      </Stack>
    </>
  );
}
