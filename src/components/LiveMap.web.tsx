import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colors, radius } from "../theme";

interface Props {
  latitude: number;
  longitude: number;
  approximate?: boolean;
}

// Reused from the Pulse project's map styling: a CSS filter applied
// directly to Leaflet's tile images (rather than fighting with a
// cross-origin embedded iframe, which can't be restyled at all). Values
// are Pulse's dark-theme variant, since ResQAI's UI is always dark.
let stylesInjected = false;
function injectMapStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .resqai-leaflet-map .leaflet-tile { filter: saturate(1.1) brightness(1.03); }
    .resqai-leaflet-map .leaflet-control-attribution {
      background: rgba(20,20,28,0.75) !important;
      color: ${colors.textMuted} !important;
      font-size: 9px !important;
      padding: 2px 6px !important;
    }
    .resqai-leaflet-map .leaflet-control-attribution a { color: ${colors.textMuted} !important; }
    .resqai-leaflet-map .leaflet-control-zoom a {
      background: ${colors.surface} !important;
      color: ${colors.text} !important;
      border-color: ${colors.border} !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Web version of the map. Renders real Leaflet.js tiles directly (same
 * library/approach as the Pulse project) instead of an embedded OSM
 * iframe -- this lets us apply the saturation/brightness filter and gives
 * a small inline attribution instead of OSM's full footer bar.
 */
export default function LiveMap({ latitude, longitude, approximate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    injectMapStyles();
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([latitude, longitude], approximate ? 5 : 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;border-radius:8px;background:${colors.accent};border:3px solid rgba(139,92,246,0.35);box-shadow:0 0 0 6px rgba(139,92,246,0.15);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center and move the marker on location updates without tearing
  // down and recreating the whole map instance.
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([latitude, longitude], approximate ? 5 : 15);
    markerRef.current?.setLatLng([latitude, longitude]);
  }, [latitude, longitude, approximate]);

  return (
    <View style={styles.container}>
      <div ref={containerRef} className="resqai-leaflet-map" style={{ width: "100%", height: "100%" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    borderRadius: radius.md,
    overflow: "hidden",
  },
});
