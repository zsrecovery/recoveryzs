// app/(tabs)/booking/Home.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import * as firebase from "../../../firebaseConfig.js"; // import JS module directly
import { Home as HomeIcon } from "lucide-react-native"; // ensure installed

type Booking = {
  id: string;
  name: string;
  phone: string;
  service: string;
  pickup?: string;
  dropoff?: string;
  vehicle?: string;
};

const Home = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBookings = async () => {
    try {
      const querySnapshot = await getDocs(collection(firebase.db, "bookings"));
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Booking, "id">; // prevent id overwrite
        bookingsData.push({ id: doc.id, ...data });
      });
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <Text>Name: {item.name}</Text>
      <Text>Phone: {item.phone}</Text>
      <Text>Service: {item.service}</Text>
      {item.pickup && <Text>Pickup: {item.pickup}</Text>}
      {item.dropoff && <Text>Dropoff: {item.dropoff}</Text>}
      {item.vehicle && <Text>Vehicle: {item.vehicle}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`/booking/details/${item.id}`)}
      >
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookings}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { padding: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  button: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
