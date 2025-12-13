import React from "react"; 
import { View, TouchableOpacity, Text, StyleSheet, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";

export default function DrawerNavigator() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/");
      setTimeout(() => {
      Alert.alert("Logged out", "You have been logged out.");
      }, 300)
    } catch (err: any) {
      Alert.alert("Logout failed", err.message);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      {/* Logo at top */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      
      </View>

      {/* Drawer Buttons */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/Dashboard")}>
          <Text style={styles.menuText}>🏠 Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/booking/BookingForm")}>
          <Text style={styles.menuText}>🛠 Request Service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/booking/bookings")}>
          <Text style={styles.menuText}>📄 View Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/screens/Settings")}>
          <Text style={styles.menuText}>⚙️ Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuBtn, { backgroundColor: "#FF3333" }]} onPress={() => router.push("/auth/Logout")}>
          <Text style={styles.menuText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 260,
    height: 240,
    marginBottom: 10,
  },
  company: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFEB3B",
  },
  menu: { paddingHorizontal: 10 },
  menuBtn: { backgroundColor: "#2E7D32", padding: 15, borderRadius: 10, marginBottom: 15 },
  menuText: { color: "#FFEB3B", fontWeight: "700", fontSize: 16 },
});
