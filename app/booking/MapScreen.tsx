// app/(tabs)/booking/MapScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, TextInput, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import * as Location from "expo-location";

const COLOR_PRIMARY = "#00ADB5";
const COLOR_SECONDARY = "#FF7B00";
const COLOR_BACKGROUND = "#222831DD";
const COLOR_TEXT_MAIN = "#EEEEEE";
const COLOR_TEXT_MUTED = "#AAAAAA";
const COLOR_DROPOFF = "red";

type LatLng = { latitude: number; longitude: number };
type DriverLocation = LatLng & { lastUpdated?: any };

const GOOGLE_MAPS_API_KEY = "AIzaSyBvAAT57RX_2jNq5PN9h5HFhQPIWwaElEc";

type MapScreenProps = {
  route?: {
    params?: {
      bookingId: string;
      dropoffLat?: number;
      dropoffLng?: number;
    };
  };
};

export default function MapScreen({ route }: MapScreenProps) {
  const params = route?.params;
  const bookingId = params?.bookingId ?? "";

  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(
    params?.dropoffLat && params?.dropoffLng
      ? { latitude: params.dropoffLat, longitude: params.dropoffLng }
      : null
  );
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
      do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : result >> 1);
      lat += dlat;
      shift = 0; result = 0;
      do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : result >> 1);
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchRoute = async (origin: LatLng, destination: LatLng) => {
    if (!origin || !destination) return;
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        const distMeters = data.routes[0].legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0);
        setDistance(distMeters / 1000);
        const durationSec = data.routes[0].legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0);
        setETA(Math.ceil(durationSec / 60));
      }
    } catch (err) {
      console.error("Google Directions API error:", err);
    }
  };

  const calculateProgress = () => {
    if (!driverLocation || routeCoords.length === 0) return 0;
    const totalDist = routeCoords.reduce((acc, p, i, arr) =>
      i === 0 ? 0 : acc + Math.hypot(p.latitude - arr[i - 1].latitude, p.longitude - arr[i - 1].longitude), 0
    );
    let traveled = 0;
    for (let i = 1; i < routeCoords.length; i++) {
      const prev = routeCoords[i - 1]; const curr = routeCoords[i];
      const segDist = Math.hypot(curr.latitude - prev.latitude, curr.longitude - prev.longitude);
      if ((driverLocation.latitude - prev.latitude) * (driverLocation.latitude - curr.latitude) <= 0 &&
          (driverLocation.longitude - prev.longitude) * (driverLocation.longitude - curr.longitude) <= 0) break;
      traveled += segDist;
    }
    return totalDist ? Math.min(traveled / totalDist, 1) : 0;
  };

  useEffect(() => {
    const progress = calculateProgress();
    Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
  }, [driverLocation, routeCoords]);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let unsubDriver: any = null;

    const init = async () => {
      // Get user location for pickup
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setPickup({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (err) {
        console.error("Pickup location error:", err);
      }

      const bookingRef = doc(db, "bookings", bookingId);
      const unsubBooking = onSnapshot(bookingRef, (snap) => {
        const data = snap.data();
        const driverId = data?.assignedDriverId;

        // Set dropoff from booking if not provided
        if (!dropoff && data?.dropoffCoords) setDropoff(data.dropoffCoords);

        if (!driverId) {
          setLoading(false);
          return;
        }

        const driverRef = doc(db, "drivers", driverId);
        unsubDriver = onSnapshot(driverRef, (driverSnap) => {
          const d = driverSnap.data();
          if (d?.latitude && d?.longitude) {
            const loc: DriverLocation = { latitude: d.latitude, longitude: d.longitude, lastUpdated: d.lastUpdated };
            setDriverLocation(loc);

            mapRef.current?.animateToRegion({ latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);

            if (pickup && dropoff) {
              const distToPickup = Math.hypot(loc.latitude - pickup.latitude, loc.longitude - pickup.longitude);
              const newPhase = distToPickup < 0.001 ? "toDropoff" : "toPickup";
              setPhase(newPhase);

              if (fetchRouteTimeout.current) clearTimeout(fetchRouteTimeout.current);
              const destination = newPhase === "toPickup" ? pickup : dropoff;
              fetchRouteTimeout.current = setTimeout(() => fetchRoute(loc, destination!), 2000);
            }
          }
          setLoading(false);
        });
      });

      return () => {
        if (fetchRouteTimeout.current) clearTimeout(fetchRouteTimeout.current);
        unsubBooking();
        if (unsubDriver) unsubDriver();
      };
    };

    init();
  }, [bookingId, dropoff, pickup]);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLOR_PRIMARY} />
      <Text style={{ color: COLOR_TEXT_MUTED, marginTop: 10 }}>Loading driver location...</Text>
    </View>
  );

  if (!driverLocation) return (
    <View style={styles.centered}>
      <Text style={{ color: COLOR_TEXT_MUTED }}>No driver location available.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
      >
        {driverLocation && <Marker coordinate={driverLocation} title="Driver" pinColor={COLOR_PRIMARY} />}
        {pickup && <Marker coordinate={pickup} title="Pickup" pinColor={COLOR_SECONDARY} />}
        {dropoff && <Marker coordinate={dropoff} title="Dropoff" pinColor={COLOR_DROPOFF} />}
        {routeCoords.length > 0 &&
          <Polyline
            coordinates={routeCoords}
            strokeColor={phase === "toPickup" ? COLOR_SECONDARY : COLOR_PRIMARY}
            strokeWidth={4}
            lineDashPattern={phase === "toPickup" ? [10, 5] : undefined}
          />}
      </MapView>

      <View style={styles.infoInputs}>
        <TextInput
          style={styles.textInput}
          value={pickup ? `${pickup.latitude.toFixed(5)}, ${pickup.longitude.toFixed(5)}` : ""}
          placeholder="Pickup (optional)"
          placeholderTextColor="#888"
          editable={false}
        />
        <TextInput
          style={styles.textInput}
          value={dropoff ? `${dropoff.latitude.toFixed(5)}, ${dropoff.longitude.toFixed(5)}` : ""}
          placeholder="Dropoff (required)"
          placeholderTextColor="#888"
          editable={false}
        />
      </View>

      {distance !== null && eta !== null && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {phase === "toPickup" ? "ETA to Pickup: " : "ETA to Dropoff: "} {eta} min
          </Text>
          <Text style={styles.infoText}>Distance: {distance.toFixed(2)} km</Text>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[styles.progressBar, {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                backgroundColor: phase === "toPickup" ? COLOR_SECONDARY : COLOR_PRIMARY
              }]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  map: { flex: 1 },
  infoBox: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: COLOR_BACKGROUND,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  infoText: { color: COLOR_TEXT_MAIN, fontSize: 18, fontWeight: "600", marginBottom: 5 },
  progressBackground: { height: 8, backgroundColor: "#444", borderRadius: 4, marginTop: 10, overflow: "hidden" },
  progressBar: { height: "100%" },
  infoInputs: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 12
  },
  textInput: {
    backgroundColor: "#333",
    color: "#FFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  }
});
