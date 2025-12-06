// app/(tabs)/booking/BookingForm.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, addDoc } from "firebase/firestore";
import * as firebase from "../../../firebaseConfig.js"; // Use exported db

type BookingData = {
  name: string;
  phone: string;
  service: string;
  pickup?: string;
  dropoff?: string;
  vehicle?: string;
};

const BookingForm = () => {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [pickup, setPickup] = useState<string>("");
  const [dropoff, setDropoff] = useState<string>("");
  const [vehicle, setVehicle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleBooking = async () => {
    if (!name || !phone || !service) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    const bookingData: BookingData = {
      name,
      phone,
      service,
      pickup: pickup || undefined,
      dropoff: dropoff || undefined,
      vehicle: vehicle || undefined,
    };

    try {
      const docRef = await addDoc(
        collection(firebase.db, "bookings"),
        bookingData as Record<string, unknown>
      );
      setLoading(false);
      router.push(`/booking/success?bookingId=${docRef.id}`);
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to create booking");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text: string) => setName(text)}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={(text: string) => setPhone(text)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Service</Text>
        <TextInput
          style={styles.input}
          value={service}
          onChangeText={(text: string) => setService(text)}
          placeholder="Enter service"
        />

        <Text style={styles.label}>Pickup (Optional)</Text>
        <TextInput
          style={styles.input}
          value={pickup}
          onChangeText={(text: string) => setPickup(text)}
          placeholder="Pickup location"
        />

        <Text style={styles.label}>Dropoff (Optional)</Text>
        <TextInput
          style={styles.input}
          value={dropoff}
          onChangeText={(text: string) => setDropoff(text)}
          placeholder="Dropoff location"
        />

        <Text style={styles.label}>Vehicle (Optional)</Text>
        <TextInput
          style={styles.input}
          value={vehicle}
          onChangeText={(text: string) => setVehicle(text)}
          placeholder="Vehicle details"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Book Now</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BookingForm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 20 },
  label: { marginTop: 15, fontSize: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  button: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 8,
    marginTop: 25,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
