import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

type LatLng = { latitude: number; longitude: number };
type BookingData = {
  pickupCoords?: LatLng;
  dropoffCoords?: LatLng;
  clientLocation?: LatLng;
};

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE"; // Replace with your key

export default function DriverMapScreen({ params }: { params: { bookingId: string } }) {
  const { bookingId } = params;

  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [clientLocation, setClientLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [phase, setPhase] = useState<"toPickup" | "toDropoff">("toPickup");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);

  const mapRef = useRef<MapView>(null);
  const fetchRouteTimeout = useRef<NodeJS.Timeout | null>(null);

  // ---------------- Polyline decode ----------------
  const decodePolyline = (t: string) => {
    let points: LatLng[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < t.length) {
      let b, shift = 0, result = 0;
      do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : result >> 1); lat += dlat;
      shift = 0; result = 0;
      do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : result >> 1); lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  // ---------------- Fetch route + distance + ETA ----------------
  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes.length) {
        const route = data.routes[0];
        setRouteCoords(decodePolyline(route.overview_polyline.points));

        // Distance in km
        const distMeters = route.legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0);
        setDistanceKm(distMeters / 1000);

        // Duration in minutes
        const durationSec = route.legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0);
        setEtaMin(Math.ceil(durationSec / 60));
      }
    } catch (err) {
      console.error("Google Directions API error:", err);
    }
  };

  // ---------------- Track driver live location ----------------
  useEffect(() => {
    const trackDriver = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Denied", "Location permission is required."); return; }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, distanceInterval: 5, timeInterval: 3000 },
        (loc) => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setDriverLocation(coords);

          mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);

          if (!pickup) return;

          // Destination based on phase
          const destination = phase === "toPickup" ? pickup : dropoff!;
          if (fetchRouteTimeout.current) clearTimeout(fetchRouteTimeout.current);
          fetchRouteTimeout.current = setTimeout(() => fetchRoute(coords, destination), 2000);

          // Switch phase automatically
          const distance = Math.hypot(coords.latitude - destination.latitude, coords.longitude - destination.longitude);
          if (phase === "toPickup" && distance < 0.0005 && dropoff) setPhase("toDropoff");
        }
      );
    };

    trackDriver();
  }, [pickup, dropoff, phase]);

  // ---------------- Listen to booking updates ----------------
  useEffect(() => {
    const bookingRef = doc(db, "bookings", bookingId);
    const unsub = onSnapshot(bookingRef, (snap) => {
      const data = snap.data() as BookingData | undefined;
      if (!data) return;
      if (data.pickupCoords) setPickup(data.pickupCoords);
      if (data.dropoffCoords) setDropoff(data.dropoffCoords);
      if (data.clientLocation) setClientLocation(data.clientLocation); // live client location
    });
    return () => unsub();
  }, [bookingId]);

  if (!driverLocation || !pickup) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ color: "#AAA", marginTop: 10 }}>Fetching locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
      >
        <Marker coordinate={driverLocation} title="You (Driver)" pinColor="#00C853" />
        {pickup && <Marker coordinate={pickup} title="Pickup" pinColor="#FFC400" />}
        {dropoff && <Marker coordinate={dropoff} title="Dropoff" pinColor="#FF3D00" />}
        {clientLocation && <Marker coordinate={clientLocation} title="Client" pinColor="#2196F3" />}
        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeColor={phase === "toPickup" ? "#FFC400" : "#00C853"} strokeWidth={4} />}
      </MapView>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Phase: {phase === "toPickup" ? "To Pickup" : "To Dropoff"}</Text>
        {distanceKm !== null && etaMin !== null && (
          <Text style={styles.infoText}>Distance: {distanceKm.toFixed(2)} km | ETA: {etaMin} min</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  infoBox: { position: "absolute", bottom: 20, left: 20, right: 20, backgroundColor: "#1E1E1EAA", padding: 12, borderRadius: 10 },
  infoText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
