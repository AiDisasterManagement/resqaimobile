import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { useApiBaseUrl } from "../src/config/apiBaseUrl";
import { colors, spacing, radius } from "../src/theme";

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useApiBaseUrl();
  const [draft, setDraft] = useState(baseUrl);
  const [saved, setSaved] = useState(false);

  function save() {
    setBaseUrl(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.label}>Backend URL</Text>
      <Text style={styles.hint}>
        This must be the LAN IP of the laptop running the FastAPI backend (uvicorn
        app.main:app --host 0.0.0.0), not "localhost" -- your phone is a separate
        device on the network. Find the laptop's IP with `ipconfig` (Windows) or
        `ifconfig` (Mac/Linux), then use http://THAT_IP:8000.
      </Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="http://192.168.1.100:8000"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>{saved ? "Saved" : "Save"}</Text>
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.label}>Current value</Text>
      <Text style={styles.currentValue}>{baseUrl}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: spacing.xs },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  currentValue: { color: colors.textMuted, fontSize: 13, fontFamily: "monospace" },
});
