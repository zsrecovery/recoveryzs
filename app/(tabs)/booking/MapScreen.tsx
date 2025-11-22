import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import haversine from "haversine-distance";

type Coords = { latitude: number; longitude: number };
type Driver = { latitude: number; longitude: number; lastUpdated?: number };

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<Driver | null>(null);
  const [targetLocation, setTargetLocation] = useState<Coords | null>(null);
  const [eta, setEta] = useState("Calculating...");

  const user = auth.currentUser;

  let unsubscribeDriver: (() => void) | null = null;

  // Fetch booking and target location
  useEffect(() => {
    if (!user) return;

    let unsubscribeBooking: (() => void) | null = null;

    const initBookingListener = async () => {
      try {
        const clientRef = doc(db, "clients", user.uid);
        const clientSnap = await getDoc(clientRef);
        if (!clientSnap.exists()) return;

        const bookingId = clientSnap.data()?.currentBookingId;
        if (!bookingId) return;

        const bookingRef = doc(db, "bookings", bookingId);
        unsubscribeBooking = onSnapshot(bookingRef, (bookingSnap) => {
          const bookingData = bookingSnap.data();
          if (!bookingData) return;

          const coords = bookingData.pickupCoords || bookingData.location;
          if (coords) setTargetLocation({ latitude: coords.latitude, longitude: coords.longitude });

          const driverId = bookingData.assignedDriverId;
          if (driverId) initDriverListener(driverId, coords);
        });
      } catch (err) {
        console.error("Error fetching booking:", err);
      }
    };

    initBookingListener();

    return () => {
      if (unsubscribeBooking) unsubscribeBooking();
      if (unsubscribeDriver) unsubscribeDriver();
    };
  }, [user]);

  // Driver listener
  const initDriverListener = (driverId: string, coords: Coords) => {
    const driverRef = doc(db, "drivers", driverId);

    if (unsubscribeDriver) unsubscribeDriver(); // remove previous listener

    unsubscribeDriver = onSnapshot(driverRef, (driverSnap) => {
      const data = driverSnap.data() as Driver;
      if (!data) return;

      setDriverLocation({ latitude: data.latitude, longitude: data.longitude, lastUpdated: Date.now() });
      setLoading(false);

      // Fit map to driver and target
      if (mapRef.current && coords) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: data.latitude, longitude: data.longitude },
            { latitude: coords.latitude, longitude: coords.longitude }
          ],
          { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
        );
      }

      // Calculate ETA
      if (coords) {
        const distanceMeters = haversine(
          { latitude: data.latitude, longitude: data.longitude },
          { latitude: coords.latitude, longitude: coords.longitude }
        );
        const averageSpeed = 40 * 1000 / 3600; // 40 km/h in m/s
        const minutes = Math.round(distanceMeters / averageSpeed / 60);
        setEta(minutes < 1 ? "Arriving now" : `${minutes} min away`);
      }
    });
  };

  if (loading || !driverLocation || !targetLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
      >
        <Marker
          coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
          title="Tow Truck"
          description={`Last updated: ${new Date(driverLocation.lastUpdated!).toLocaleTimeString()}`}
          pinColor="green"
        />
        <Marker
          coordinate={{ latitude: targetLocation.latitude, longitude: targetLocation.longitude }}
          title="Your Location"
          pinColor="red"
        />
      </MapView>

      <View style={styles.etaContainer}>
        <Text style={styles.etaText}>🚚 Tow Truck: {eta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#555" },
  etaContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 10
  },
  etaText: { color: "#FFF", fontWeight: "bold", fontSize: 16 }
});
