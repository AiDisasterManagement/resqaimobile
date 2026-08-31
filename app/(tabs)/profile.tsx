import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, radius } from "../../src/theme";

const MENU_ITEMS: { icon: any; label: string; sublabel: string; route: string }[] = [
  {
    icon: "chatbubble-ellipses",
    label: "Emergency Assistant",
    sublabel: "Ask questions grounded in your live situation",
    route: "/assistant",
  },
  {
    icon: "book",
    label: "Offline Guide",
    sublabel: "Survival steps that work with no connection",
    route: "/guide",
  },
  {
    icon: "settings-outline",
    label: "Backend Settings",
    sublabel: "Change which server the app connects to",
    route: "/settings",
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.accent} />
        </View>
        <Text style={styles.name}>Your Profile</Text>
        <Text style={styles.subtext}>ResQAI citizen account</Text>
      </View>

      <Text style={styles.sectionTitle}>More</Text>
      {MENU_ITEMS.map((item) => (
        <Pressable
          key={item.route}
          style={styles.menuRow}
          onPress={() => router.push(item.route as any)}
        >
          <View style={styles.menuIconWrap}>
            <Ionicons name={item.icon} size={18} color={colors.accent} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuSublabel}>{item.sublabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  avatarWrap: { alignItems: "center", marginBottom: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  name: { color: colors.text, fontSize: 18, fontWeight: "700" },
  subtext: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: { flex: 1 },
  menuLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  menuSublabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
