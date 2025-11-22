// app/booking/BookingForm.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, Alert, View, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { db } from "../../../firebaseConfig";

type Coords = { latitude: number; longitude: number };
type Driver = { id: string; name?: string; status?: string; latitude?: number; longitude?: number; currentBookingId?: string };

export default function BookingForm() {
  const router = useRouter();
  const [location, setLocation] = useState<Coords | null>(null);
  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // <-- loading state
  const [formData, setFormData] = useState({
    name: "",
    phoneCode: "+254",
    phone: "",
    vehicle: "",
    service: "",
    pickup: "",
    dropoff: "",
    time: "",
    note: "",
  });

  const locationServices = ["Towing", "Car Delivery Service", "Vehicle Transport"];
  const handleChange = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  useEffect(() => {
    if (!assignedDriverId) return;
    const unsub = onSnapshot(collection(db, "bookings"), async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "modified") {
          const bookingData = change.doc.data();
          if (bookingData.status === "completed" && bookingData.assignedDriverId === assignedDriverId) {
            await updateDoc(doc(db, "drivers", assignedDriverId), { status: "Available", currentBookingId: null });
          }
        }
      }
    });
    return () => unsub();
  }, [assignedDriverId]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.service) {
      Alert.alert("Missing fields", "Please fill in Name, Phone, and Service.");
      return;
    }
    if (locationServices.includes(formData.service) && !formData.pickup) {
      Alert.alert("Missing pickup location", "Please add a pickup location.");
      return;
    }

    setLoading(true); // <-- start loading

    try {
      let coords: Coords | null = null;
      if (!locationServices.includes(formData.service)) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const current = await Location.getCurrentPositionAsync({});
          coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
          setLocation(coords);
        }
      }

      const mapsLink = locationServices.includes(formData.service)
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.pickup)}`
        : coords
        ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
        : "N/A";

      const booking = {
        ...formData,
        fullPhone: `${formData.phoneCode}${formData.phone}`,
        mapsLink,
        status: "requested",
        createdAt: serverTimestamp(),
        location: coords,
        pickupCoords: locationServices.includes(formData.service) ? null : coords,
      };

      const docRef = await addDoc(collection(db, "bookings"), booking);

      const availableDriversSnap = await getDocs(query(collection(db, "drivers"), where("status", "==", "Available")));
      const availableDrivers: Driver[] = availableDriversSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Driver, "id">) }));
      if (!availableDrivers.length) { Alert.alert("No drivers available", "Please try again shortly."); setLoading(false); return; }

      const assignedDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
      await updateDoc(doc(db, "drivers", assignedDriver.id), { status: "Busy", currentBookingId: docRef.id });
      await updateDoc(doc(db, "bookings", docRef.id), { assignedDriverId: assignedDriver.id, status: "assigned" });
      setAssignedDriverId(assignedDriver.id);

      Alert.alert("Driver Assigned", `Driver ${assignedDriver.name || "Unnamed"} has been assigned.`);

      await emailjs.send(
        "service_jo3devf",
        "template_97tyxpa",
        { ...formData, fullPhone: booking.fullPhone, mapsLink },
        "XhRmSbYpNO3CpA8z7"
      );

      router.push({ pathname: "/booking/success", params: { bookingId: docRef.id, ...formData, fullPhone: booking.fullPhone, assignedDriverId: assignedDriver.id } });

      setFormData({ name: "", phoneCode: "+254", phone: "", vehicle: "", service: "", pickup: "", dropoff: "", time: "", note: "" });

    } catch (err) {
      Alert.alert("Error", `Booking failed: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setLoading(false); // <-- stop loading
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)/booking/Home")} activeOpacity={0.7}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🚗 Click. Book. Rescue.</Text>

      <TextInput placeholder="Full Name" value={formData.name} onChangeText={v => handleChange("name", v)} style={styles.input} />

      <View style={styles.row}>
        <Picker selectedValue={formData.phoneCode} onValueChange={(v: string) => handleChange("phoneCode", v)} style={styles.picker}>
          <Picker.Item label="+254 🇰🇪 Kenya" value="+254" />
          <Picker.Item label="+44 🇬🇧 UK" value="+44" />
          <Picker.Item label="+1 🇺🇸 USA" value="+1" />
        </Picker>
        <TextInput placeholder="Phone Number" keyboardType="phone-pad" value={formData.phone} onChangeText={v => handleChange("phone", v)} style={[styles.input, { flex: 1, marginLeft: 10 }]} />
      </View>

      <TextInput placeholder="Vehicle Type (optional)" value={formData.vehicle} onChangeText={v => handleChange("vehicle", v)} style={styles.input} />

      <Picker selectedValue={formData.service} onValueChange={(v: string) => handleChange("service", v)} style={[styles.input, styles.picker]}>
        <Picker.Item label="Select a Service" value="" />
        <Picker.Item label="Towing" value="Towing" />
        <Picker.Item label="Car Delivery Service" value="Car Delivery Service" />
        <Picker.Item label="Battery Jumpstart" value="Battery Jumpstart" />
        <Picker.Item label="Tire Change" value="Tire Change" />
        <Picker.Item label="Fuel Delivery" value="Fuel Delivery" />
      </Picker>

      {locationServices.includes(formData.service) && <>
        <TextInput placeholder="Pickup Location" value={formData.pickup} onChangeText={v => handleChange("pickup", v)} style={styles.input} />
        <TextInput placeholder="Dropoff Location" value={formData.dropoff} onChangeText={v => handleChange("dropoff", v)} style={styles.input} />
      </>}

      <TextInput placeholder="Preferred Time (optional)" value={formData.time} onChangeText={v => handleChange("time", v)} style={styles.input} />
      <TextInput placeholder="Additional Notes" value={formData.note} onChangeText={v => handleChange("note", v)} style={[styles.input, styles.notes]} multiline />

      <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, loading && { opacity: 0.7 }]} disabled={loading}>
        {loading ? <ActivityIndicator color="#2E7D32" /> : <Text style={styles.submitButtonText}>Submit Booking</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 20 },
  backButton: { backgroundColor: "#FFCC00", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start", marginBottom: 15 },
  backButtonText: { color: "#2E7D32", fontWeight: "bold", fontSize: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2E7D32", textAlign: "center", marginBottom: 20 },
  input: { backgroundColor: "#FFF", padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#CCC" },
  row: { flexDirection: "row", marginBottom: 12 },
  picker: { width: 150, backgroundColor: "#FFF", borderRadius: 8, borderWidth: 1, borderColor: "#CCC" },
  notes: { height: 80, textAlignVertical: "top" },
  submitButton: { backgroundColor: "#FFCC00", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  submitButtonText: { color: "#2E7D32", fontWeight: "bold", fontSize: 16 },
});
