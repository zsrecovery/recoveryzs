// app/(tabs)/booking/Success.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Alert, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

type Driver = {
  name?: string;
  phone?: string;
};

export default function SuccessScreen() {
  const router = useRouter();
  const {
    bookingId,
    name,
    phone,
    service,
    vehicle,
    pickup,
    dropoff,
    time,
    note,
    assignedDriverId,
  } = useLocalSearchParams<{
    bookingId: string;
    name: string;
    phone: string;
    service: string;
    vehicle: string;
    pickup: string;
    dropoff: string;
    time: string;
    note: string;
    assignedDriverId?: string;
  }>();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriver = async () => {
      if (!assignedDriverId) return setLoading(false);

      try {
        const driverRef = doc(db, "drivers", assignedDriverId);
        const driverSnap = await getDoc(driverRef);
        if (driverSnap.exists()) {
          setDriver(driverSnap.data() as Driver);
        }
      } catch (err) {
        console.error("Failed to fetch driver:", err);
        Alert.alert("Error", "Could not fetch driver details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [assignedDriverId]);

  const handleCall = () => {
    const numberToCall = driver?.phone || "+447835307112";
    Linking.openURL(`tel:${numberToCall}`);
  };

  const handleWhatsApp = () => {
    const numberToMessage = driver?.phone || "+447835307112";
    const formatted = numberToMessage.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/${formatted}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text>Loading driver info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo at the top */}
      <Image
        source={require("../../../assets/logo.png")}
        style={{ width: 180, height: 160, resizeMode: "contain", alignSelf: "center", marginBottom: 10,borderWidth: 2, borderColor: "#2E7D32",// green border matching theme
    borderRadius: 20,      // rounded edges
    shadowColor: "#000",   // shadow to make it pop
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
   }}
      />

      <Text style={styles.title}>✅ Booking Successful!</Text>

      <View style={styles.card}>
        <Text>Booking ID: {bookingId}</Text>
        <Text>Name: {name}</Text>
        <Text>Phone: {phone}</Text>
        <Text>Service: {service}</Text>
        {pickup ? <Text>Pickup: {pickup}</Text> : null}
        {dropoff ? <Text>Dropoff: {dropoff}</Text> : null}
        {vehicle ? <Text>Vehicle: {vehicle}</Text> : null}
        {time ? <Text>Preferred Time: {time}</Text> : null}
        {note ? <Text>Note: {note}</Text> : null}
      </View>

      {driver ? (
        <View style={styles.driverCard}>
          <Text style={{ fontWeight: "bold" }}>Assigned Driver</Text>
          <Text>Name: {driver.name || "Unnamed"}</Text>
          <Text>Phone: {driver.phone || "N/A"}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#4CAF50" }]} onPress={handleCall}>
              <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#25D366" }]} onPress={handleWhatsApp}>
              <Text style={styles.buttonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={{ marginTop: 15 }}>Driver details not available.</Text>

          {/* Fallback WhatsApp + Call to YOUR number */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#4CAF50" }]} onPress={handleCall}>
              <Text style={styles.buttonText}>Call Dispatch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#25D366" }]} onPress={handleWhatsApp}>
              <Text style={styles.buttonText}>WhatsApp Dispatch</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/booking/Home")}
        style={styles.homeButton}
      >
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#F5F5F5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#2E7D32", marginBottom: 15, textAlign: "center" },
  card: { backgroundColor: "#FFF", padding: 20, borderRadius: 10, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  driverCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 10, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "bold" },
  homeButton: { backgroundColor: "#FFCC00", padding: 12, borderRadius: 8, marginTop: 15, alignItems: "center" },
  homeButtonText: { color: "#2E7D32", fontWeight: "bold", fontSize: 16 },
});
