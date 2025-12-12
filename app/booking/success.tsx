// app/booking/SuccessScreen.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

const THEME = {
  GREEN: "#00C853",
  YELLOW: "#FFCC00",
  DARK_BG: "#000000ff",
  CARD_BG: "#edeaeaff",
  TEXT: "#faf7f7ff",
  MUTED: "#AAAAAA",
};

type SuccessScreenProps = {
  searchParams?: { bookingId?: string };
};

export default function SuccessScreen({ searchParams }: SuccessScreenProps) {
  const router = useRouter();
  const bookingId = searchParams?.bookingId;

  const rescuerPhone = "+447835307112";

  const handleTrackBooking = () => {
  if (!bookingId) return router.push("/");

  router.push({
    pathname: "/booking/MapScreen",
    params: {
      bookingId,
      // MapScreen will ignore these if undefined, so it's safe
      dropoffLat: null,
      dropoffLng: null,
    },
  });
};


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.header}>Booking Confirmed!</Text>

        {bookingId && (
          <Text style={styles.bookingId}>Tracking ID: {bookingId}</Text>
        )}

        <Text style={styles.message}>
          A rescuer has been assigned to your case. You can contact them or track your service progress.
        </Text>

        {/* Rescuer Card */}
        <View style={styles.rescuerCard}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/219/219986.png",
            }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.rescuerLabel}>Rescuer Assigned</Text>
            <Text style={styles.rescuerName}>Fpeve Bagaza</Text>
            <Text style={styles.rescuerRole}>Recovery Specialist</Text>
          </View>
        </View>

        {/* Track Service */}
        <TouchableOpacity style={styles.button} onPress={handleTrackBooking}>
          <Text style={styles.buttonText}>Track Service</Text>
        </TouchableOpacity>

        {/* WhatsApp */}
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: "#25D366" }]}
          onPress={() => {
            const url = `https://wa.me/${rescuerPhone.replace("+", "")}`;
            Linking.openURL(url).catch(() =>
              Alert.alert("Error", "Unable to open WhatsApp.")
            );
          }}
        >
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/733/733585.png",
            }}
            style={styles.icon}
          />
          <Text style={styles.contactText}>Chat on WhatsApp</Text>
        </TouchableOpacity>

        {/* Call */}
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: "#1E88E5" }]}
          onPress={() => Linking.openURL(`tel:${rescuerPhone}`)}
        >
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/724/724664.png",
            }}
            style={styles.icon}
          />
          <Text style={styles.contactText}>Call Rescuer</Text>
        </TouchableOpacity>

        {/* Home */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/Dashboard")}
        >
          <Text style={[styles.buttonText, { color: THEME.GREEN }]}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

//
// Styles
//
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
    padding: 28,
    borderRadius: 20,
    width: "100%",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: THEME.TEXT,
    textAlign: "center",
  },
  bookingId: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.YELLOW,
    textAlign: "center",
    marginTop: 10,
  },
  message: {
    fontSize: 15,
    color: THEME.MUTED,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 25,
  },

  rescuerCard: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 60,
    marginRight: 15,
  },
  rescuerLabel: {
    color: THEME.MUTED,
    fontSize: 14,
  },
  rescuerName: {
    color: THEME.GREEN,
    fontSize: 18,
    fontWeight: "700",
  },
  rescuerRole: {
    color: THEME.MUTED,
    fontSize: 14,
  },

  button: {
    backgroundColor: THEME.GREEN,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 18,
  },
  buttonText: {
    color: THEME.TEXT,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 12,
  },
  contactText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  homeButton: {
    backgroundColor: THEME.CARD_BG,
    borderWidth: 1,
    borderColor: THEME.GREEN,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
  },
});
