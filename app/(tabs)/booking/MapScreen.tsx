// app/(tabs)/booking/MapScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

type LatLng = { latitude: number; longitude: number };
type DriverLocation = LatLng & { lastUpdated?: any };

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE"; // Replace with your key

export default function MapScreen({ params }: { params: { bookingId: string } }) {
  const { bookingId } = params;
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setETA] = useState<number | null>(null);
  const [phase, setPhase] = useState<"toPickup" | "toDropoff">("toPickup");
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const fetchRouteTimeout = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const decodePolyline = (t: string) => {
    let points: LatLng[] = [];
    let index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoords(points);

        const distMeters = route.legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0);
        setDistance(distMeters / 1000);

        const durationSec = route.legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0);
        setETA(Math.ceil(durationSec / 60));
      }
    } catch (err) {
      console.error("Google Directions API error:", err);
    }
  };

  const calculateProgress = () => {
    if (!driverLocation || routeCoords.length === 0) return 0;
    const totalDist = routeCoords.reduce((acc, p, i, arr) => {
      if (i === 0) return 0;
      const prev = arr[i - 1];
      return acc + Math.hypot(p.latitude - prev.latitude, p.longitude - prev.longitude);
    }, 0);

    let traveledDist = 0;
    for (let i = 1; i < routeCoords.length; i++) {
      const prev = routeCoords[i - 1];
      const curr = routeCoords[i];
      const segmentDist = Math.hypot(curr.latitude - prev.latitude, curr.longitude - prev.longitude);
      traveledDist += segmentDist;
      if (
        (driverLocation.latitude - prev.latitude) * (driverLocation.latitude - curr.latitude) <= 0 &&
        (driverLocation.longitude - prev.longitude) * (driverLocation.longitude - curr.longitude) <= 0
      ) {
        break;
      }
    }

    return totalDist ? Math.min(traveledDist / totalDist, 1) : 0;
  };

  useEffect(() => {
    const progress = calculateProgress();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [driverLocation, routeCoords]);

  useEffect(() => {
    const bookingRef = doc(db, "bookings", bookingId);

    const unsubBooking = onSnapshot(bookingRef, (bookingSnap) => {
      const bookingData = bookingSnap.data();
      const driverId = bookingData?.assignedDriverId;
      const pickupCoords = bookingData?.pickupCoords;
      const dropoffCoords = bookingData?.dropoffCoords;

      if (pickupCoords) setPickup(pickupCoords);
      if (dropoffCoords) setDropoff(dropoffCoords);

      if (!driverId) return;

      const driverRef = doc(db, "drivers", driverId);
      const unsubDriver = onSnapshot(driverRef, (driverSnap) => {
        const data = driverSnap.data();
        if (data?.latitude && data?.longitude) {
          const newLocation: DriverLocation = {
            latitude: data.latitude,
            longitude: data.longitude,
            lastUpdated: data.lastUpdated,
          };
          setDriverLocation(newLocation);

          const region: Region = {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          mapRef.current?.animateToRegion(region, 500);

          if (pickup && dropoff) {
            const distanceToPickup = Math.hypot(
              newLocation.latitude - pickup.latitude,
              newLocation.longitude - pickup.longitude
            );

            if (distanceToPickup < 0.0005) setPhase("toDropoff");
            else setPhase("toPickup");

            if (fetchRouteTimeout.current) clearTimeout(fetchRouteTimeout.current);
            const destination = phase === "toPickup" ? pickup : dropoff;
            fetchRouteTimeout.current = setTimeout(() => fetchRoute(newLocation, destination), 5000);
          }
        }
        setLoading(false);
      });

      return () => unsubDriver();
    });

    return () => unsubBooking();
  }, [bookingId, pickup, dropoff, phase]);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ color: "#AAA", marginTop: 10 }}>Loading driver location...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: driverLocation!.latitude,
          longitude: driverLocation!.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={driverLocation!} title="Driver" pinColor="#00C853" />
        {pickup && <Marker coordinate={pickup} title="Pickup" pinColor="green" />}
        {dropoff && <Marker coordinate={dropoff} title="Dropoff" pinColor="red" />}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={phase === "toPickup" ? "#FFC400" : "#00C853"}
            strokeWidth={4}
          />
        )}
      </MapView>

      {distance !== null && eta !== null && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {phase === "toPickup" ? "ETA to Pickup: " : "ETA to Dropoff: "} {eta} min
          </Text>
          <Text style={styles.infoText}>Distance: {distance.toFixed(2)} km</Text>

          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                  backgroundColor: phase === "toPickup" ? "#FFC400" : "#00C853",
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  infoBox: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#1E1E1EAA",
    padding: 12,
    borderRadius: 10,
  },
  infoText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  progressBackground: {
    height: 10,
    backgroundColor: "#333",
    borderRadius: 5,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
});
