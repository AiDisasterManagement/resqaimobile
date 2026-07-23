import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius } from "../../src/theme";

/**
 * Deliberately has zero network calls -- this is the one screen that must
 * keep working when a disaster has taken down connectivity entirely.
 * Content lives in this file so it ships inside the app bundle, not fetched
 * at runtime.
 */
const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Flood safety",
    items: [
      "Move to higher ground immediately if water is rising.",
      "Avoid walking or driving through moving water -- 15cm can knock you over, 30cm can float a car.",
      "Turn off electricity at the main breaker if it's safe to reach.",
      "Avoid contact with floodwater; it may be contaminated.",
    ],
  },
  {
    title: "Structural collapse",
    items: [
      "If a building feels unstable, leave immediately without stopping to gather belongings.",
      "Do not use elevators.",
      "Once outside, move away from the structure -- aftershocks or further collapse can happen.",
      "If trapped, tap on a pipe or wall rather than shouting, to conserve energy.",
    ],
  },
  {
    title: "Basic first aid",
    items: [
      "For bleeding: apply firm, direct pressure with a clean cloth until it stops.",
      "For suspected fractures: immobilize the area, don't try to realign it.",
      "For shock (pale, cold, rapid pulse): lay the person down, elevate legs if no fracture, keep them warm.",
      "Check for responsiveness and breathing before anything else.",
    ],
  },
  {
    title: "If you can't reach help",
    items: [
      "Conserve phone battery -- switch to airplane mode between check-ins if signal is weak.",
      "Signal for help with three of anything (three whistle blasts, three flashes of light).",
      "Stay with your group if possible; a group is easier to spot than an individual.",
      "Ration water before food -- most people can survive far longer without food than water.",
    ],
  },
  {
    title: "Water purification",
    items: [
      "Boiling is the most reliable method: bring water to a rolling boil for at least 1 minute.",
      "If you can't boil, water purification tablets are a reliable backup -- follow the package timing exactly.",
      "Avoid drinking floodwater or visibly contaminated water even if boiled; boiling kills pathogens but doesn't remove chemical contamination.",
      "Let cloudy water settle and filter through a clean cloth before boiling or treating.",
    ],
  },
  {
    title: "Signaling for help",
    items: [
      "During the day: bright clothing, a mirror or reflective surface, or smoke from a fire are visible from a distance.",
      "At night: three flashes of light repeated in a pattern is a widely recognized distress signal.",
      "If you have a whistle, three short blasts, repeated, carries further than shouting and doesn't tire you out.",
      "Stay near open ground if possible -- easier for responders to spot you from the air or a distance.",
    ],
  },
  {
    title: "If separated from your group",
    items: [
      "Stay where you are if you realize you're separated -- moving further makes it harder for others to find you.",
      "Agree on a meeting point in advance if possible, before you actually need it.",
      "Make noise periodically (calling out, whistle) so others can locate you by sound.",
      "If you must move, leave a visible marker (e.g. a piece of clothing) showing your direction of travel.",
    ],
  },
];

export default function GuideScreen() {
  const [openSection, setOpenSection] = useState<string | null>(SECTIONS[0].title);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>Offline emergency guide</Text>
      <Text style={styles.hint}>
        Works with no signal and no backend connection -- everything on this screen
        is bundled with the app.
      </Text>

      {SECTIONS.map((section) => {
        const isOpen = openSection === section.title;
        return (
          <View key={section.title} style={styles.card}>
            <Pressable
              onPress={() => setOpenSection(isOpen ? null : section.title)}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.chevron}>{isOpen ? "-" : "+"}</Text>
            </Pressable>
            {isOpen && (
              <View style={styles.itemList}>
                {section.items.map((item, i) => (
                  <Text key={i} style={styles.item}>
                    {"\u2022"} {item}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "600", marginBottom: spacing.xs },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: "700" },
  itemList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  item: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.xs },
});
