// app/booking/SuccessScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const THEME = {
  GREEN: "#00C853",
  YELLOW: "#FFCC00",
  DARK_BG: "#121212",
  CARD_BG: "#1E1E1E",
  TEXT: "#FFFFFF",
  MUTED: "#AAAAAA",
};

type SuccessScreenProps = {
  searchParams?: { bookingId?: string };
};

export default function SuccessScreen({ searchParams }: SuccessScreenProps) {
  const router = useRouter();
  const bookingId = searchParams?.bookingId;

  const handleTrackBooking = () => {
    if (bookingId) {
      router.push(`/booking/track?bookingId=${bookingId}`);
    } else {
      router.push("/"); // fallback to home
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Booking Confirmed!</Text>
        {bookingId && <Text style={styles.bookingId}>Your Tracking ID: {bookingId}</Text>}
        <Text style={styles.message}>
          Thank you for using our rescue services. You can track your booking status using the button below.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleTrackBooking}>
          <Text style={styles.buttonText}>Track Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.homeButton]}
          onPress={() => router.push("/")}
        >
          <Text style={[styles.buttonText, { color: THEME.GREEN }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.DARK_BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: THEME.CARD_BG,
    padding: 30,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: THEME.TEXT,
    marginBottom: 15,
    textAlign: "center",
  },
  bookingId: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.YELLOW,
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: THEME.MUTED,
    textAlign: "center",
    marginBottom: 25,
  },
  button: {
    backgroundColor: THEME.GREEN,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  homeButton: {
    backgroundColor: THEME.CARD_BG,
    borderWidth: 1,
    borderColor: THEME.GREEN,
  },
  buttonText: {
    color: THEME.TEXT,
    fontSize: 18,
    fontWeight: "bold",
  },
});
