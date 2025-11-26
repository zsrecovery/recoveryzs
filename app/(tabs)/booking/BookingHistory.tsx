// app/(tabs)/booking/BookingHistory.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { collection, doc, onSnapshot, query, where, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

type Booking = {
  id: string;
  name: string;
  phone: string;
  location: string;
  createdAt: number;
  status: "requested" | "pending" | "assigned" | "onRoute" | "completed";
  assignedDriverId?: string;
};

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  vehicle?: string;
};

type UserProfile = {
  uid: string;
  phone: string;
  name?: string;
  userType?: string;
};

export default function BookingHistory() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        Alert.alert("Error", "User profile not found.");
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch bookings once user profile is loaded
  useEffect(() => {
    if (!userProfile) return;

    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("phone", "==", userProfile.phone));

    const unsub = onSnapshot(q, async (snapshot) => {
      const data: Booking[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      setBookings(data);

      // Load driver info for assigned bookings
      const driverIds = data.filter((b) => b.assignedDriverId).map((b) => b.assignedDriverId!);
      const newDrivers: Record<string, Driver> = {};

      await Promise.all(
        driverIds.map(async (id) => {
          if (!drivers[id]) {
            const docSnap = await getDoc(doc(db, "drivers", id));
            if (docSnap.exists()) newDrivers[id] = { id: docSnap.id, ...docSnap.data() } as Driver;
          }
        })
      );

      setDrivers((prev) => ({ ...prev, ...newDrivers }));
      setLoading(false);
    });

    return () => unsub();
  }, [userProfile]);

  const renderBooking = ({ item }: { item: Booking }) => {
    const driver = item.assignedDriverId ? drivers[item.assignedDriverId] : null;

    const handleTrack = () => {
      if (!item.assignedDriverId) {
        Alert.alert("Driver not assigned yet");
        return;
      }
      router.push({ pathname: "/booking/MapScreen", params: { bookingId: item.id } });
    };

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking: {item.name}</Text>
        <Text style={styles.cardText}>Location: {item.location}</Text>
        <Text style={styles.cardText}>Status: {item.status}</Text>
        <Text style={styles.cardText}>
          Driver: {driver ? `${driver.name ?? "Unknown"} (${driver.phone ?? "N/A"})` : "Not assigned"}
        </Text>
        <Text style={styles.cardText}>Created: {new Date(item.createdAt).toLocaleString()}</Text>

        {item.status !== "completed" && item.assignedDriverId && (
          <TouchableOpacity style={styles.trackBtn} onPress={handleTrack}>
            <Text style={styles.trackBtnText}>📍 Track Driver</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ color: "#AAA", marginTop: 10 }}>Loading bookings...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {bookings.length === 0 ? (
        <Text style={styles.noBooking}>No bookings found.</Text>
      ) : (
        <FlatList
          data={bookings.sort((a, b) => b.createdAt - a.createdAt)}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#121212" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  noBooking: { color: "#AAA", fontSize: 16, textAlign: "center", marginTop: 30 },
  card: { backgroundColor: "#1E1E1E", padding: 15, borderRadius: 10, marginVertical: 8 },
  cardTitle: { color: "#FFEB3B", fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  cardText: { color: "#FFF", fontSize: 14, marginBottom: 3 },
  trackBtn: {
    marginTop: 8,
    backgroundColor: "#00C853",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  trackBtnText: { color: "#121212", fontWeight: "bold" },
});
