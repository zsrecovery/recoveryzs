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
  ImageBackground,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import emailjs from "@emailjs/browser";

type BookingData = {
  name: string;
  phone: string;
  service: string;
  pickup?: string;
  dropoff?: string;
  vehicle?: string;
  bookingDate?: any;
};

const BookingForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const services = [
    "Vehicle Recovery",
    "Tyre Change",
    "Roadside Assistance",
    "Jump Starting",
    "Vehicle Delivery",
  ];

  const handleBooking = async () => {
    if (!name || !phone || !service) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    setLoading(true);

    let pickupCoords: string | null = null;
    let dropoffCoords: string | null = null;
    let mapLink: string | null = null;

    if (["Vehicle Recovery", "Vehicle Delivery"].includes(service)) {
      try {
        const encodedPickup = encodeURIComponent(pickup);
        const encodedDropoff = encodeURIComponent(dropoff);

        const geoPickupRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPickup}&key=YOUR_GOOGLE_API_KEY`
        );
        const pickupData = await geoPickupRes.json();
        if (pickupData.results?.length) {
          const loc = pickupData.results[0].geometry.location;
          pickupCoords = `${loc.lat},${loc.lng}`;
        }

        const geoDropoffRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedDropoff}&key=YOUR_GOOGLE_API_KEY`
        );
        const dropoffData = await geoDropoffRes.json();
        if (dropoffData.results?.length) {
          const loc = dropoffData.results[0].geometry.location;
          dropoffCoords = `${loc.lat},${loc.lng}`;
        }

        if (pickupCoords && dropoffCoords) {
          mapLink = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords}&destination=${dropoffCoords}`;
        }
      } catch (err) {
        console.log("Geocoding error:", err);
      }
    }

    const bookingData: BookingData & { userId: string } = {
      name,
      phone,
      service,
      ...(pickup ? { pickup } : {}),
      ...(dropoff ? { dropoff } : {}),
      ...(vehicle ? { vehicle } : {}),
      bookingDate: serverTimestamp(),
      userId: auth.currentUser?.uid || "unknown-user",
    };

    try {
      const docRef = await addDoc(collection(db, "bookings"), bookingData as Record<string, unknown>);

      try {
        await emailjs.send(
          "service_jo3devf",
          "template_97tyxpa",
          {
            to_name: name,
            user_phone: phone,
            service_type: service,
            pickup_location: pickup || "Not provided",
            dropoff_location: dropoff || "Not provided",
            vehicle_details: vehicle || "Not provided",
            map_link: mapLink || "Not available",
            booking_id: docRef.id,
          },
          "XhRmSbYpNO3CpA8z7"
        );
      } catch (emailError) {
        console.log("EmailJS error:", emailError);
      }

      setLoading(false);
      router.push(`/booking/success?bookingId=${docRef.id}`);
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to create booking");
      console.error(error);
    }
  };

  const showPicker = () => setShowDatePicker(true);
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ImageBackground
        source={require("../../assets/truck.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>

            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/Dashboard")}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            {/* INSERTED IMAGE */}
            <View style={styles.topImageWrapper}>
              <ImageBackground
                source={require("../../assets/bwtowtruck.png")}
                style={styles.topImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.caption}>Stranded? We’ve Got You Covered!</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Service</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={service} onValueChange={setService}>
                <Picker.Item label="Select a service" value="" />
                {services.map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>

            {["Vehicle Recovery", "Vehicle Delivery"].includes(service) && (
              <>
                <Text style={styles.label}>Pickup Location</Text>
                <TextInput
                  style={styles.input}
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Pickup location"
                />

                <Text style={styles.label}>Dropoff Location</Text>
                <TextInput
                  style={styles.input}
                  value={dropoff}
                  onChangeText={setDropoff}
                  placeholder="Dropoff location"
                />
              </>
            )}

            {["Vehicle Recovery", "Tyre Change", "Roadside Assistance", "Jump Starting"].includes(service) && (
              <>
                <Text style={styles.label}>Vehicle Details</Text>
                <TextInput
                  style={styles.input}
                  value={vehicle}
                  onChangeText={setVehicle}
                  placeholder="Vehicle details"
                />
              </>
            )}

            <Text style={styles.label}>Booking Date</Text>
            <TouchableOpacity onPress={showPicker} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>{date.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
            )}

            <TouchableOpacity style={styles.button} onPress={handleBooking} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Book Now</Text>}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

export default BookingForm;


/* ---------------------------------------------------------
   UPDATED STYLES (Image styles added only, nothing removed)
----------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(255,255,255,0.7)" },

  scrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 40,
  },

  backButton: { marginTop: 60, marginBottom: 10 },
  backButtonText: {
    color: "#00C853",
    fontSize: 15,
    fontWeight: "700",
  },

  /* NEW IMAGE WRAPPER + IMAGE STYLES */
  topImageWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  topImage: {
    width: "95%",
    height: 120,
  },

  caption: {
    paddingTop: 5,
    paddingBottom: 10,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#09a149ff",
  },

  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    backgroundColor: "white",
    fontSize: 14,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 7,
    marginTop: 4,
    backgroundColor: "#fff",
    height: 40,
    justifyContent: "center",
  },

  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    backgroundColor: "white",
  },
  dateButtonText: { fontSize: 14 },

  button: {
    backgroundColor: "green",
    paddingVertical: 10,
    borderRadius: 7,
    marginTop: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
