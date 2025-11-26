// app/(tabs)/booking/TowDriverScreen.tsx
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Audio, AVPlaybackStatus } from "expo-av";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "../../../firebaseConfig";
import { LOCATION_TASK_NAME } from "../../backgroundTasks/locationTask";

// -------------------- TypeScript Types --------------------
type Booking = {
  id: string;
  status: string;
  service?: string;
  name?: string;
  fullPhone?: string;
  pickup?: string;
  dropoff?: string;
  assignedDriverId?: string;
};

type Driver = {
  id: string;
  status: string;
  currentBookingId?: string;
  lastSeen?: any;
  latitude?: number;
  longitude?: number;
};

// -------------------- Component --------------------
export default function TowDriverScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const driverId = user?.uid;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [assignedBookings, setAssignedBookings] = useState<Booking[]>([]);
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tracking, setTracking] = useState(false);

  const previousPendingCount = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ----------------- Load alert sound -----------------
  useEffect(() => {
    let sound: Audio.Sound | null = null;

    const loadSound = async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          require("../../../../assets/alert.mp3")
        );
        sound = s;
        soundRef.current = s;
      } catch (e) {
        console.log("Sound load error:", e);
      }
    };

    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync().catch((err) => console.log("Sound unload error:", err));
      }
    };
  }, []);

  const playAlertSound = async () => {
    try {
      if (soundRef.current) await soundRef.current.replayAsync();
    } catch (e) {
      console.log("Sound play error:", e);
    }
  };

  // ----------------- Initialize driver -----------------
  useEffect(() => {
    if (!driverId) return;

    const initDriver = async () => {
      try {
        await setDoc(
          doc(db, "drivers", driverId),
          { status: "Available", lastSeen: new Date() },
          { merge: true }
        );

        const driverRef = doc(db, "drivers", driverId);
        const unsub = onSnapshot(driverRef, async (snapshot) => {
          const data = snapshot.data() as Driver | undefined;
          if (!data) return;

          setDriver({ ...data, id: snapshot.id });

          // Load current booking if assigned
          if (data.currentBookingId) {
            const bookingSnap = await getDoc(doc(db, "bookings", data.currentBookingId));
            if (bookingSnap.exists()) {
              setCurrentBooking({ id: bookingSnap.id, ...bookingSnap.data() } as Booking);
            } else {
              setCurrentBooking(null);
            }
          } else {
            setCurrentBooking(null);
          }

          setLoading(false);
        });

        return unsub;
      } catch (err) {
        console.error("Driver init error:", err);
        setLoading(false);
      }
    };

    initDriver();
  }, [driverId]);

  // ----------------- Pending bookings listener -----------------
  useEffect(() => {
    const q = query(collection(db, "bookings"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snapshot) => {
      const pending: Booking[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      if (pending.length > previousPendingCount.current) playAlertSound();
      previousPendingCount.current = pending.length;
      setAvailableBookings(pending);
    });
    return () => unsub();
  }, []);

  // ----------------- Assigned bookings listener -----------------
  useEffect(() => {
    if (!driverId) return;
    const q = query(
      collection(db, "bookings"),
      where("assignedDriverId", "==", driverId),
      where("status", "in", ["assigned", "onRoute"])
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const assigned: Booking[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      setAssignedBookings(assigned);
    });
    return () => unsub();
  }, [driverId]);

  // ----------------- Background location tracking -----------------
  const startBackgroundUpdates = async () => {
    if (!driverId) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

    if (status !== "granted" || bgStatus !== "granted") {
      Alert.alert("Permission Denied", "Foreground and Background location required.");
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 5,
        timeInterval: 5000,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: "ZS Recovery Tracking",
          notificationBody: "Location tracking is active.",
        },
      });
    }

    setTracking(true);
  };

  const stopBackgroundUpdates = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setTracking(false);
  };

  // ----------------- Logout -----------------
  const handleLogout = async () => {
    try {
      await stopBackgroundUpdates();
      await signOut(auth);
      router.replace("/(tabs)/booking");
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Could not log out.");
    }
  };

  // ----------------- Mark booking as completed -----------------
  const markAsCompleted = async (bookingId: string) => {
    if (!driverId) return;
    await updateDoc(doc(db, "bookings", bookingId), { status: "completed" });
    await updateDoc(doc(db, "drivers", driverId), { status: "Available", currentBookingId: "" });
    setCurrentBooking(null);
    Alert.alert("✅ Job Completed", "You are now available.");
  };

  // ----------------- Accept pending booking -----------------
  const acceptBooking = async (bookingId: string) => {
    if (!driverId) return;
    await updateDoc(doc(db, "bookings", bookingId), { assignedDriverId: driverId, status: "assigned" });
    await updateDoc(doc(db, "drivers", driverId), { currentBookingId: bookingId, status: "On Job" });
    Alert.alert("✅ Booking Accepted", "You can now start the job.");
  };

  // ----------------- Refresh -----------------
  const onRefresh = () => {
    setRefreshing(true);
    previousPendingCount.current = availableBookings.length;
    setTimeout(() => setRefreshing(false), 800);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ color: "#AAA", marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // ----------------- Render -----------------
  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>🚚 ZS Tow Driver Dashboard</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Driver Status</Text>
        <Text
          style={[
            styles.statusValue,
            { color: driver?.status === "Available" ? "#00C853" : "#FFC400" },
          ]}
        >
          {driver?.status || "Unknown"}
        </Text>
      </View>

      <View style={styles.countsRow}>
        <Text style={styles.countText}>
          Pending: <Text style={{ color: "#FFC400" }}>{availableBookings.length}</Text>
        </Text>
        <Text style={styles.countText}>
          Assigned: <Text style={{ color: "#00C853" }}>{assignedBookings.length}</Text>
        </Text>
      </View>

      <TouchableOpacity
        onPress={tracking ? stopBackgroundUpdates : startBackgroundUpdates}
        style={[styles.button, tracking ? styles.stopButton : styles.startButton]}
      >
        <Text style={styles.buttonText}>{tracking ? "Stop Tracking" : "Start Tracking"}</Text>
      </TouchableOpacity>

      {/* Current Booking */}
      {currentBooking && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Current Active Booking</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>Service: {currentBooking.service}</Text>
            <Text style={styles.cardText}>Client: {currentBooking.name}</Text>
            <Text style={styles.cardText}>Phone: {currentBooking.fullPhone}</Text>
            <Text style={styles.cardText}>Pickup: {currentBooking.pickup || "Live Location"}</Text>
            <Text style={styles.cardText}>Dropoff: {currentBooking.dropoff || "N/A"}</Text>
            <TouchableOpacity style={[styles.button, styles.completeButton]} onPress={() => markAsCompleted(currentBooking.id)}>
              <Text style={styles.buttonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pending Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Pending Bookings</Text>
        {availableBookings.length === 0 ? (
          <Text style={{ color: "#AAA" }}>No pending bookings.</Text>
        ) : (
          availableBookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardText}>Service: {b.service}</Text>
              <Text style={styles.cardText}>Client: {b.name}</Text>
              <Text style={styles.cardText}>Pickup: {b.pickup || "Live Location"}</Text>
              <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={() => acceptBooking(b.id)}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#121212", paddingBottom: 50 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", color: "#FFCC00", marginBottom: 15, textAlign: "center" },
  statusBox: { backgroundColor: "#1E1E1E", padding: 12, borderRadius: 8, marginBottom: 12 },
  statusLabel: { color: "#AAA" },
  statusValue: { fontSize: 18, fontWeight: "bold" },
  countsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  countText: { fontSize: 16, fontWeight: "bold", color: "#FFF" },
  button: { padding: 12, borderRadius: 8, marginVertical: 6, alignItems: "center" },
  startButton: { backgroundColor: "#00C853" },
  stopButton: { backgroundColor: "#FF5252" },
  completeButton: { backgroundColor: "#FFC400" },
  acceptButton: { backgroundColor: "#00C853" },
  logoutButton: { backgroundColor: "#FF3D00" },
  buttonText: { color: "#121212", fontWeight: "bold" },
  section: { marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#FFCC00", marginBottom: 6 },
  card: { backgroundColor: "#1E1E1E", padding: 12, borderRadius: 8, marginVertical: 6 },
  cardText: { color: "#FFF", marginBottom: 4 },
});
