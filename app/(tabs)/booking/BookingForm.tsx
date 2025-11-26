// BookingForm.tsx (Fully Fixed with Firestore Transaction)

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { addDoc, collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { router } from "expo-router";

export default function BookingForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const createBooking = async () => {
    if (!name || !phone || !location) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // CREATE BOOKING FIRST
      const bookingRef = await addDoc(collection(db, "bookings"), {
        name,
        phone,
        location,
        createdAt: Date.now(),
        status: "requested",
        assignedDriverId: null,
      });

      // RUN TRANSACTION FOR SAFE DRIVER ASSIGNMENT
      const assignedDriverId = await runTransaction(db, async (trx) => {
        const driversQuery = query(
          collection(db, "drivers"),
          where("status", "==", "Available")
        );

        const snap = await getDocs(driversQuery);
        if (snap.empty) {
          trx.update(doc(db, "bookings", bookingRef.id), {
            status: "pending",
          });
          return null;
        }

        // RANDOM DRIVER
        const docsArr = snap.docs;
        const picked = docsArr[Math.floor(Math.random() * docsArr.length)];
        const driverRef = doc(db, "drivers", picked.id);
        const bookingDocRef = doc(db, "bookings", bookingRef.id);

        trx.update(driverRef, {
          status: "On Job",
          currentBookingId: bookingRef.id,
        });

        trx.update(bookingDocRef, {
          status: "assigned",
          assignedDriverId: picked.id,
        });

        return picked.id;
      });

      // GO TO SUCCESS PAGE WITH DIRECT PARAMS
      router.push({
        pathname: "/(tabs)/booking/Success",
        params: {
          bookingId: bookingRef.id,
          assignedDriverId: assignedDriverId ?? "none",
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Request Tow Service</Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#777"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#777"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Your Location"
        placeholderTextColor="#777"
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={createBooking}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#000" },
  heading: { fontSize: 24, color: "yellow", fontWeight: "bold", marginBottom: 20 },
  input: {
    backgroundColor: "#111",
    padding: 12,
    color: "white",
    borderColor: "green",
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 5,
  },
  btn: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
