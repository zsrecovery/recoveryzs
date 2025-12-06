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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
// Assuming the user's firebase config is imported correctly
import { db, auth } from "../../../firebaseConfig";
// Import the location task definition
import { LOCATION_TASK_NAME } from "../../backgroundTasks/locationTask";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// -------------------- Theme Colors --------------------
const Colors = {
  // Main Palette
  BG_DEEP: "#0A0A0A", // Very dark background
  BG_ELEMENT: "#1F1F1F", // Card/Element background
  PRIMARY_ACCENT: "#FFC300", // Rich Gold/Amber for ZS Recovery branding
  
  // Status Colors
  SUCCESS: "#10B981", // Teal/Green for Available/Accept/Start
  WARNING: "#FBBF24", // Bright Amber for On Job/Completion
  DANGER: "#EF4444", // Clean Red for Stop/Logout
  
  // Text & UI
  TEXT_LIGHT: "#F3F4F6", // Off-White for main text
  TEXT_MUTED: "#A0AEC0", // Muted Grey for labels/subtitles
};

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
  status: "Available" | "On Job" | "Offline";
  currentBookingId?: string;
  lastSeen?: any;
  latitude?: number;
  longitude?: number;
};

// -------------------- Component --------------------
export default function DriverDashboard() {
  const router = useRouter();
  const user = auth.currentUser;
  const driverId = user?.uid;
  const driverName = user?.displayName || "Driver";

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
        // NOTE: Path for alert.mp3 is based on user's previous snippet.
        const { sound: s } = await Audio.Sound.createAsync(
          require("../../../../assets/alert.mp3")
        );
        sound = s;
        soundRef.current = s;
      } catch (e) {
        console.error("Sound load error: Check if assets/alert.mp3 exists.", e);
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
      console.error("Sound play error:", e);
    }
  };

  // ----------------- Initialize driver and track status -----------------
  useEffect(() => {
    if (!driverId) return;

    const initDriver = async () => {
      try {
        // 1. Ensure driver document exists (or update status)
        await setDoc(
          doc(db, "drivers", driverId),
          { status: "Available", lastSeen: new Date().getTime(), name: driverName },
          { merge: true }
        );
        
        // 2. Check if tracking was active before app close
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        setTracking(isRegistered);

        // 3. Setup real-time listener for driver document
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

  // ----------------- Pending bookings listener (for audio alert) -----------------
  useEffect(() => {
    const q = query(collection(db, "bookings"), where("status", "==", "requested")); // Use 'requested' for initial pool
    const unsub = onSnapshot(q, (snapshot) => {
      const pending: Booking[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      
      // Play alert only if new bookings appeared
      if (pending.length > previousPendingCount.current && previousPendingCount.current !== 0) {
          playAlertSound();
      }
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

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

    if (status !== "granted" || bgStatus !== "granted") {
      Alert.alert("Permission Denied", "Foreground and Background location required to track your status.");
      return;
    }

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (!isRegistered) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 5, // Update every 5 meters
          timeInterval: 5000, // Or every 5 seconds
          showsBackgroundLocationIndicator: true,
          pausesUpdatesAutomatically: false,
          foregroundService: Platform.OS === 'android' ? {
              notificationTitle: "ZS Recovery Tracking",
              notificationBody: "Your location is active for job dispatch.",
              notificationColor: Colors.SUCCESS,
          } : undefined,
        });
        setTracking(true);
        Alert.alert("Tracking Started", "Your location is now being updated to the system.");
      }
    } catch (e) {
        console.error("Failed to start tracking:", e);
        Alert.alert("Tracking Error", "Could not start background updates.");
    }
  };

  const stopBackgroundUpdates = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isRegistered) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setTracking(false);
      Alert.alert("Tracking Stopped", "Your location updates have ceased.");
    } catch (e) {
        console.error("Failed to stop tracking:", e);
    }
  };

  // ----------------- Logout -----------------
  const handleLogout = async () => {
    try {
      await stopBackgroundUpdates();
      // Also mark driver as Offline in Firestore
      if (driverId) {
          await updateDoc(doc(db, "drivers", driverId), { status: "Offline" });
      }
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Could not log out.");
    }
  };

  // ----------------- Mark booking as completed -----------------
  const markAsCompleted = async (bookingId: string) => {
    if (!driverId) return;
    try {
        await updateDoc(doc(db, "bookings", bookingId), { status: "completed" });
        await updateDoc(doc(db, "drivers", driverId), { status: "Available", currentBookingId: "" });
        setCurrentBooking(null);
        Alert.alert("✅ Job Completed", "You are now available for new bookings.");
    } catch (e) {
        console.error("Completion error:", e);
        Alert.alert("Error", "Failed to mark job as complete.");
    }
  };

  // ----------------- Accept pending booking -----------------
  const acceptBooking = async (bookingId: string) => {
    if (!driverId) return;
    if (driver?.status === "On Job") {
        Alert.alert("Busy", "You must complete your current job before accepting a new one.");
        return;
    }
    try {
        await updateDoc(doc(db, "bookings", bookingId), { assignedDriverId: driverId, status: "assigned" });
        await updateDoc(doc(db, "drivers", driverId), { currentBookingId: bookingId, status: "On Job" });
        Alert.alert("✅ Booking Accepted", "Your dashboard is updated with the client details.");
    } catch (e) {
        console.error("Acceptance error:", e);
        Alert.alert("Error", "Failed to accept booking.");
    }
  };

  // ----------------- Refresh -----------------
  const onRefresh = () => {
    setRefreshing(true);
    // Force a re-fetch check by setting the previous count to the current count
    previousPendingCount.current = availableBookings.length;
    setTimeout(() => setRefreshing(false), 800);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        {/* Use the primary accent for the loader */}
        <ActivityIndicator size="large" color={Colors.PRIMARY_ACCENT} /> 
        <Text style={{ color: Colors.TEXT_MUTED, marginTop: 10 }}>Loading Driver Profile and Jobs...</Text>
      </View>
    );
  }

  // ----------------- Render -----------------
  const driverStatusColor = driver?.status === "Available" ? Colors.SUCCESS : driver?.status === "On Job" ? Colors.WARNING : Colors.DANGER;
  const trackingColor = tracking ? Colors.SUCCESS : Colors.DANGER;

  return (
    <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_ACCENT} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ZS Recovery Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {driverName}</Text>
      </View>


      <View style={styles.statusRow}>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Driver Status</Text>
          <Text style={[styles.statusValue, { color: driverStatusColor }]}>
            {driver?.status || "Unknown"}
          </Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Tracking</Text>
          <Text style={[styles.statusValue, { color: trackingColor }]}>
            {tracking ? "LIVE" : "OFF"}
          </Text>
        </View>
      </View>


      <TouchableOpacity
        onPress={tracking ? stopBackgroundUpdates : startBackgroundUpdates}
        style={[styles.button, tracking ? styles.stopButton : styles.startButton]}
      >
        <Ionicons name={tracking ? "location-sharp" : "location-outline"} size={20} color={Colors.BG_DEEP} />
        <Text style={[styles.buttonText, { color: Colors.BG_DEEP }]}>
            {tracking ? "Stop Location Tracking" : "Start Tracking (Go Online)"}
        </Text>
      </TouchableOpacity>

      <View style={styles.countsRow}>
        <Text style={styles.countText}>
          Pending Jobs: <Text style={{ color: Colors.WARNING }}>{availableBookings.length}</Text>
        </Text>
        <Text style={styles.countText}>
          My Assigned: <Text style={{ color: Colors.SUCCESS }}>{assignedBookings.length}</Text>
        </Text>
      </View>

      {/* Current Booking */}
      {currentBooking && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Active Job</Text>
          <View style={[styles.card, styles.activeJobCard]}>
            <Text style={styles.cardText}><MaterialIcons name="miscellaneous-services" size={16} color={Colors.TEXT_LIGHT} /> Service: {currentBooking.service}</Text>
            <Text style={styles.cardText}><Ionicons name="person" size={16} color={Colors.TEXT_LIGHT} /> Client: {currentBooking.name}</Text>
            <Text style={styles.cardText}><Ionicons name="call" size={16} color={Colors.TEXT_LIGHT} /> Phone: {currentBooking.fullPhone}</Text>
            <Text style={styles.cardText}><Ionicons name="pin" size={16} color={Colors.TEXT_LIGHT} /> Pickup: {currentBooking.pickup || "Live Location"}</Text>
            <Text style={styles.cardText}><Ionicons name="car" size={16} color={Colors.TEXT_LIGHT} /> Status: {currentBooking.status.toUpperCase()}</Text>
            <TouchableOpacity style={[styles.button, styles.completeButton]} onPress={() => markAsCompleted(currentBooking.id)}>
              <Text style={styles.buttonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pending Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Unassigned Jobs</Text>
        {availableBookings.length === 0 ? (
          <Text style={styles.emptyText}>No new jobs are currently awaiting assignment.</Text>
        ) : (
          availableBookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardText}><MaterialIcons name="miscellaneous-services" size={16} color={Colors.TEXT_LIGHT} /> Service: {b.service}</Text>
              <Text style={styles.cardText}><Ionicons name="person" size={16} color={Colors.TEXT_LIGHT} /> Client: {b.name}</Text>
              <Text style={styles.cardText}><Ionicons name="pin" size={16} color={Colors.TEXT_LIGHT} /> Pickup: {b.pickup || "Live Location"}</Text>
              
              <TouchableOpacity 
                style={[styles.button, styles.acceptButton, driver?.status === "On Job" && {opacity: 0.5}]} 
                onPress={() => acceptBooking(b.id)}
                disabled={driver?.status === "On Job"}
              >
                <Text style={styles.buttonText}>Accept Job</Text>
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
  container: { flex: 1, padding: 15, backgroundColor: Colors.BG_DEEP, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.BG_DEEP },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.PRIMARY_ACCENT,
    marginBottom: 20
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.PRIMARY_ACCENT },
  headerSubtitle: { fontSize: 14, color: Colors.TEXT_MUTED },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statusBox: { backgroundColor: Colors.BG_ELEMENT, padding: 12, borderRadius: 8, flex: 1, marginHorizontal: 5 },
  statusLabel: { color: Colors.TEXT_MUTED, fontSize: 12, marginBottom: 4 },
  statusValue: { fontSize: 20, fontWeight: "bold" },
  countsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    padding: 10, 
    backgroundColor: Colors.BG_ELEMENT,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: Colors.PRIMARY_ACCENT,
  },
  countText: { fontSize: 14, fontWeight: "bold", color: Colors.TEXT_LIGHT },
  button: { 
    flexDirection: 'row',
    padding: 14, 
    borderRadius: 8, 
    marginVertical: 6, 
    alignItems: "center", 
    justifyContent: 'center',
    shadowColor: Colors.BG_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5.46,
    elevation: 8,
  },
  // START/STOP Tracking Button
  startButton: { backgroundColor: Colors.SUCCESS }, 
  stopButton: { backgroundColor: Colors.DANGER }, 
  
  // Job Action Buttons
  completeButton: { backgroundColor: Colors.WARNING, marginTop: 15 }, 
  acceptButton: { backgroundColor: Colors.SUCCESS, marginTop: 10 },
  
  // Logout Button
  logoutButton: { backgroundColor: Colors.DANGER, marginTop: 20 },
  
  buttonText: { color: Colors.BG_DEEP, fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  section: { marginVertical: 10 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: Colors.PRIMARY_ACCENT, 
    marginBottom: 8, 
    borderLeftWidth: 3, 
    borderLeftColor: Colors.PRIMARY_ACCENT, 
    paddingLeft: 10 
  },
  card: { backgroundColor: Colors.BG_ELEMENT, padding: 15, borderRadius: 8, marginVertical: 6, borderWidth: 1, borderColor: '#333' },
  activeJobCard: { borderColor: Colors.WARNING, borderWidth: 2 }, // Border highlights the active job
  cardText: { color: Colors.TEXT_LIGHT, marginBottom: 8, fontSize: 15 },
  emptyText: { color: Colors.TEXT_MUTED, fontStyle: 'italic', paddingLeft: 10 }
});