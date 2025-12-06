// app/screens/Tracking.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert } from "react-native";
import { db } from "@/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Booking {
  id: string;
  name: string;
  phone: string;
  service: string;
  pickup?: string;
  dropoff?: string;
  vehicle?: string;
  status: string;
}

export default function Tracking() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bookings"), where("status", "==", "assigned")); // example filter
      const querySnapshot = await getDocs(q);
      const data: Booking[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...(doc.data() as Omit<Booking, "id">) });
      });
      setBookings(data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>Phone: {item.phone}</Text>
      <Text>Service: {item.service}</Text>
      {item.pickup && <Text>Pickup: {item.pickup}</Text>}
      {item.dropoff && <Text>Dropoff: {item.dropoff}</Text>}
      {item.vehicle && <Text>Vehicle: {item.vehicle}</Text>}
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracking Bookings</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00C853" />
      ) : bookings.length === 0 ? (
        <Text style={styles.emptyText}>No assigned bookings</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00C853",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderColor: "#FFEB3B",
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  emptyText: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
});
