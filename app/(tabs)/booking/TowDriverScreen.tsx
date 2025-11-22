// app/(tabs)/booking/TowDriverScreen.tsx
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Audio } from "expo-av"; // 🔊 NEW
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { db, auth } from "../../../firebaseConfig";
import { LOCATION_TASK_NAME } from "../../backgroundTasks/locationTask";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function TowDriverScreen() {
  const [tracking, setTracking] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const previousPendingCount = useRef(0); // 🔔 track new pending bookings
  const soundRef = useRef<Audio.Sound | null>(null); // 🔊 sound memory

  const router = useRouter();
  const user = auth.currentUser;
  const driverId = user?.uid;

  // 🔊 Load sound effect
  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/alert.mp3") // ADD a beep file into /assets
      );
      soundRef.current = sound;
    } catch (e) {
      console.log("Sound load error:", e);
    }
  };

  useEffect(() => {
    loadSound();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // 🔊 Play alert sound
  const playAlertSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (e) {
      console.log("Sound play error:", e);
    }
  };

  // 🔹 Initialize driver document
  useEffect(() => {
    if (!driverId) return;

    const initDriver = async () => {
      try {
        await setDoc(
          doc(db, "drivers", driverId),
          { status: "Available" },
          { merge: true }
        );

        const driverRef = doc(db, "drivers", driverId);
        const unsub = onSnapshot(driverRef, async (snapshot) => {
          const driverData = snapshot.data();
          setDriver(driverData);
          setLoading(false);

          if (driverData?.currentBookingId) {
            const bookingRef = doc(db, "bookings", driverData.currentBookingId);
            const bookingSnap = await getDoc(bookingRef);
            if (bookingSnap.exists())
              setCurrentBooking({
                id: bookingSnap.id,
                ...bookingSnap.data(),
              });
          } else {
            setCurrentBooking(null);
          }
        });

        return () => unsub();
      } catch (err) {
        console.error("Error initializing driver:", err);
        setLoading(false);
      }
    };

    initDriver();
  }, [driverId]);

  // 🔹 Listen for pending bookings + alert sound
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "pending"),
      where("assignedDriverId", "==", "")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const pending = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // 🔊 Play alert if new bookings were added
      if (pending.length > previousPendingCount.current) {
        playAlertSound();
      }

      previousPendingCount.current = pending.length;
      setAvailableBookings(pending);
    });

    return () => unsub();
  }, []);

  // 🔹 Listen for assigned bookings
  useEffect(() => {
    if (!driverId) return;

    const q = query(
      collection(db, "bookings"),
      where("assignedDriverId", "==", driverId),
      where("status", "in", ["assigned", "onRoute"])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const assigned = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setAssignedBookings(assigned);
    });

    return () => unsub();
  }, [driverId]);

  // 🔹 Refresh function
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      previousPendingCount.current = availableBookings.length;
    } catch {}

    setTimeout(() => setRefreshing(false), 800);
  };

  // 🔹 Stop background tracking on unmount
  useEffect(() => {
    return () => {
      stopBackgroundUpdates();
    };
  }, []);

  const startBackgroundUpdates = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "App requires location access.");
      return;
    }

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      Alert.alert("Permission Denied", "Background location permission denied.");
      return;
    }

    try {
      const isRegistered =
        await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
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
    } catch (error) {
      console.warn("Error starting background location task:", error);
    }
  };

  const stopBackgroundUpdates = async () => {
    try {
      const isRegistered =
        await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered)
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.warn("Error stopping background location task:", error);
    }
    setTracking(false);
  };

  const handleLogout = async () => {
    try {
      await stopBackgroundUpdates();
      await signOut(auth);
      Alert.alert("Signed Out", "You’ve been logged out successfully.");
      router.replace("/(tabs)/booking");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  const markAsCompleted = async (bookingId: string) => {
    if (!driverId) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: "completed" });
      await updateDoc(doc(db, "drivers", driverId), {
        status: "Available",
        currentBookingId: "",
      });
      Alert.alert("✅ Job Completed", "You are now available for new requests.");
    } catch (err) {
      console.error("Error marking job complete:", err);
      Alert.alert("Error", "Could not mark job as completed.");
    }
  };

  const acceptBooking = async (bookingId: string) => {
    if (!driverId) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        assignedDriverId: driverId,
        status: "assigned",
      });
      await updateDoc(doc(db, "drivers", driverId), {
        currentBookingId: bookingId,
        status: "On Job",
      });
      Alert.alert("Success", "You have accepted the booking!");
    } catch (err) {
      console.error("Error accepting booking:", err);
      Alert.alert("Error", "Could not accept booking.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text>Loading driver data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>🚚 ZS Tow Driver Dashboard</Text>

      <Text style={styles.status}>
        Status:{" "}
        <Text
          style={{
            color: driver?.status === "Available" ? "green" : "red",
          }}
        >
          {driver?.status || "Unknown"}
        </Text>
      </Text>

      {/* Counts */}
      <Text style={styles.countText}>
        Pending: <Text style={{ color: "#E65100" }}>{availableBookings.length}</Text> | 
        Assigned: <Text style={{ color: "#2E7D32" }}>{assignedBookings.length}</Text>
      </Text>

      <TouchableOpacity
        onPress={tracking ? stopBackgroundUpdates : startBackgroundUpdates}
        style={[
          styles.button,
          tracking ? styles.stopButton : styles.startButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </Text>
      </TouchableOpacity>

      {/* Assigned Bookings */}
      {assignedBookings.length > 0 && (
        <View style={styles.bookingSection}>
          <Text style={styles.sectionHeader}>📌 Assigned Bookings</Text>
          {assignedBookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text>Customer: {b.customerName}</Text>
              <Text>Service: {b.service}</Text>
              <Text>Pickup: {b.pickup}</Text>
              <Text>Dropoff: {b.dropoff}</Text>
              <Text>Phone: {b.fullPhone}</Text>

              <TouchableOpacity
                style={[styles.button, styles.markCompletedButton]}
                onPress={() => markAsCompleted(b.id)}
              >
                <Text style={[styles.buttonText, { color: "#2E7D32" }]}>
                  ✅ Mark as Completed
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Pending Bookings */}
      {availableBookings.length > 0 && (
        <View style={styles.bookingSection}>
          <Text style={styles.sectionHeader}>📋 Pending Bookings</Text>
          {availableBookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text>Customer: {b.customerName}</Text>
              <Text>Service: {b.service}</Text>
              <Text>Pickup: {b.pickup}</Text>
              <Text>Dropoff: {b.dropoff}</Text>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#00C853", marginTop: 10 }]}
                onPress={() => acceptBooking(b.id)}
              >
                <Text style={styles.buttonText}>Accept Booking</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {assignedBookings.length === 0 && availableBookings.length === 0 && (
        <Text style={{ color: "#777", marginTop: 20 }}>
          No bookings available at the moment.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: "#FFFDE7",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
  countText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "600",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#2E7D32",
  },
  stopButton: {
    backgroundColor: "#E53935",
  },
  markCompletedButton: {
    backgroundColor: "#FFCC00",
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#555",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    marginBottom: 15,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  bookingSection: {
    width: "100%",
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
