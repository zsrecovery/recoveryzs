// app/(tabs)/booking/Home.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [driverAssigned, setDriverAssigned] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(true);

  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.7)).current;

  // 🔹 Listen for real-time client booking updates
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const clientRef = doc(db, "clients", user.uid);

    const unsub = onSnapshot(clientRef, async (snapshot) => {
      const data = snapshot.data();
      const bookingId = data?.currentBookingId;
      setHasActiveBooking(!!bookingId);

      if (bookingId) {
        const bookingRef = doc(db, "bookings", bookingId);

        const bookingUnsub = onSnapshot(bookingRef, (bookingSnap) => {
          const bookingData = bookingSnap.data();
          setDriverAssigned(!!bookingData?.assignedDriverId);
          setLoadingDriver(false);
        });

        return () => bookingUnsub();
      } else {
        setDriverAssigned(false);
        setLoadingDriver(false);
      }
    });

    return () => unsub();
  }, []);

  const toggleMenu = (open: boolean) => {
    setMenuOpen(open);
    Animated.timing(slideAnim, {
      toValue: open ? 0 : -SCREEN_WIDTH * 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleTrackTow = () => {
    if (!driverAssigned) {
      Alert.alert("Please wait", "Driver is still being assigned to your booking.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    const clientRef = doc(db, "clients", user.uid);
    onSnapshot(clientRef, async (snapshot) => {
      const bookingId = snapshot.data()?.currentBookingId;
      if (!bookingId) {
        Alert.alert("No active booking found.");
        return;
      }
      router.push({ pathname: "/booking/MapScreen", params: { bookingId } });
    });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/screens/Login");
    } catch (err) {
      Alert.alert("Error", "Failed to log out.");
      console.error(err);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/road3.png")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => toggleMenu(!menuOpen)}
            style={styles.hamburgerContainer}
          >
            <Text style={styles.hamburger}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.tagline}>Your Roadside Heroes Are Here!</Text>
        </View>

        {/* Hamburger Menu */}
        {menuOpen && (
          <>
            <Pressable
              style={styles.pressableOverlay}
              onPress={() => toggleMenu(false)}
            />
            <Animated.View
              style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}
            >
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.menuLogo}
              />

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: "#00C853" }]}
                onPress={() => {
                  router.push("/booking/BookingForm");
                  toggleMenu(false);
                }}
              >
                <Text style={styles.menuItemText}>🚗 Make a Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  { backgroundColor: driverAssigned ? "#FFEB3B" : "#888" },
                ]}
                onPress={() => {
                  handleTrackTow();
                  toggleMenu(false);
                }}
                disabled={!driverAssigned}
              >
                {loadingDriver ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: driverAssigned ? "#2E7D32" : "#DDD" },
                    ]}
                  >
                    {driverAssigned ? "📍 Track a Tow" : "🚧 Driver being assigned..."}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: "#00C853" }]}
                onPress={() => {
                  router.push("/screens/Settings");
                  toggleMenu(false);
                }}
              >
                <Text style={styles.menuItemText}>⚙️ Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: "#FF5252" }]}
                onPress={() => {
                  handleLogout();
                  toggleMenu(false);
                }}
              >
                <Text style={styles.menuItemText}>🚪 Log Out</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Services Section (restored) */}
        <View style={styles.content}>
          <Text style={styles.servicesHeader}>Our Services</Text>

          <View style={styles.serviceContainer}>
            <Text style={styles.serviceTitle}>🚗 Towing</Text>
            <Text style={styles.serviceDesc}>
              Fast and reliable towing whenever you need it. We bring your vehicle safely back on the road.
            </Text>
          </View>

          <View style={styles.serviceContainer}>
            <Text style={styles.serviceTitle}>📦 Car Delivery Service</Text>
            <Text style={styles.serviceDesc}>
              Hassle-free car delivery tailored to your schedule and preferences.
            </Text>
          </View>

          <View style={styles.serviceContainer}>
            <Text style={styles.serviceTitle}>🔋 Battery Jumpstart</Text>
            <Text style={styles.serviceDesc}>
              Quick battery jumpstart to get you moving again without delay.
            </Text>
          </View>

          <View style={styles.serviceContainer}>
            <Text style={styles.serviceTitle}>🔧 Tire Change</Text>
            <Text style={styles.serviceDesc}>
              Fast and professional tire change service, ready wherever you are.
            </Text>
          </View>

          <View style={styles.serviceContainer}>
            <Text style={styles.serviceTitle}>⛽ Fuel Delivery</Text>
            <Text style={styles.serviceDesc}>
              Convenient fuel delivery straight to you when you need it most.
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 0, paddingTop: 0 },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#2E7D32", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
  hamburgerContainer: { marginRight: 15 },
  hamburger: { color: "#FFEB3B", fontSize: 28 },
  tagline: { color: "#FFF", fontSize: 20, fontWeight: "bold", flexShrink: 1 },
  pressableOverlay: { position: "absolute", top: 0, left: SCREEN_WIDTH * 0.7, width: SCREEN_WIDTH * 0.3, height: "100%", backgroundColor: "rgba(0,0,0,0.5)" },
  menu: { position: "absolute", left: 0, top: 0, width: SCREEN_WIDTH * 0.7, height: "100%", backgroundColor: "#000", paddingTop: 60, paddingHorizontal: 10, zIndex: 10 },
  menuLogo: { width: 230, height: 200, resizeMode: "contain", alignSelf: "center", marginBottom: 5 },
  menuItem: { padding: 15, borderRadius: 10, marginBottom: 15, alignItems: "center" },
  menuItemText: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  content: { marginTop: 20, marginBottom: 30 },
  servicesHeader: { color: "#FFF", fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  serviceContainer: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    width: "90%",
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#FFEB3B",
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  serviceTitle: { color: "#00C853", fontSize: 18, fontWeight: "bold" },
  serviceDesc: { color: "#000", fontSize: 14, marginTop: 5 },
});
