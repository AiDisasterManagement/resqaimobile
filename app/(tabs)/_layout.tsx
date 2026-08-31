import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shelters"
        options={{
          title: "Safety & Shelters",
          tabBarLabel: "Safety",
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: "Alerts",
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />

      {/* Kept fully functional and routable (e.g. from the Profile screen),
          just hidden from the bottom tab bar so it matches the 4-tab design. */}
      <Tabs.Screen
        name="assistant"
        options={{ title: "Emergency assistant", href: null }}
      />
      <Tabs.Screen
        name="guide"
        options={{ title: "Offline guide", href: null }}
      />
    </Tabs>
  );
}
