// app/screens/Booking.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

type Booking = {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  service: string;
  bookingDate?: Timestamp | string;
  pickup?: string;
  dropoff?: string;
  vehicle?: string;
};

export default function BookingScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, "bookings"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingsData: Booking[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Booking, "id">),
        }));
        setBookings(bookingsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching bookings:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const formatDate = (date?: Timestamp | string) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date.toDate();
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const isExpanded = expandedIds.includes(item.id);
    return (
      <View style={styles.bookingContainer}>
        <View style={styles.row}>
          <Text style={[styles.cell, { flex: 2 }]}>{formatDate(item.bookingDate)}</Text>
          <Text style={[styles.cell, { flex: 2 }]}>{item.service}</Text>
          <TouchableOpacity
            style={[styles.button, { flex: 1 }]}
            onPress={() => toggleExpand(item.id)}
          >
            <Text style={styles.buttonText}>{isExpanded ? "Hide" : "View"}</Text>
          </TouchableOpacity>
        </View>
        {isExpanded && (
          <View style={styles.details}>
            <Text style={styles.detailText}>Name: {item.name}</Text>
            <Text style={styles.detailText}>Phone: {item.phone}</Text>
            {item.pickup && <Text style={styles.detailText}>Pickup: {item.pickup}</Text>}
            {item.dropoff && <Text style={styles.detailText}>Dropoff: {item.dropoff}</Text>}
            {item.vehicle && <Text style={styles.detailText}>Vehicle: {item.vehicle}</Text>}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ marginTop: 10, color: "#000" }}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/road3.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push("/Dashboard")}
          >
            <Text style={styles.topButtonText}>🏠 Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push("/booking/BookingForm")}
          >
            <Text style={styles.topButtonText}>📌 Book Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Service</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Action</Text>
          </View>

          <FlatList
            data={bookings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 80 },
  topBar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  topButton: { backgroundColor: "#00C853", padding: 10, borderRadius: 6 },
  topButtonText: { color: "#fff", fontWeight: "600" },
  tableContainer: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#FFD700",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  headerCell: { fontWeight: "700", fontSize: 14, color: "#000" },
  bookingContainer: {
    marginBottom: 6,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff" },
  cell: { fontSize: 14, color: "#000", padding: 10 },
  button: {
    backgroundColor: "#00C853",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    margin: 5,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  details: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#FFD700",
  },
  detailText: { fontSize: 13, color: "#000", marginTop: 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
