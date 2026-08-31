import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { colors, radius } from "../theme";

interface Props {
  latitude: number;
  longitude: number;
  approximate?: boolean;
}

/**
 * Real interactive map for the native app (iOS/Android via Expo Go, or a
 * standalone build later). Uses Apple Maps on iOS and Google Maps on
 * Android by default -- no API key needed for basic use in Expo Go.
 * For a standalone Android build later, you'll need to add your own
 * Google Maps API key in app.json (android.config.googleMaps.apiKey).
 */
export default function LiveMap({ latitude, longitude, approximate }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: approximate ? 6 : 0.01,
        longitudeDelta: approximate ? 6 : 0.01,
      }}
      region={{
        latitude,
        longitude,
        latitudeDelta: approximate ? 6 : 0.01,
        longitudeDelta: approximate ? 6 : 0.01,
      }}
    >
      <Marker coordinate={{ latitude, longitude }} pinColor={colors.accent} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
    borderRadius: radius.md,
  },
});
