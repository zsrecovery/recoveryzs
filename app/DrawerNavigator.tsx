import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Dimensions, Modal, TouchableWithoutFeedback, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";

export default function DrawerOverlay() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth * 0.65;

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setVisible(false);
      router.replace("/");
      setTimeout(() => {
        Alert.alert("Logged out", "You have been logged out.");
      }, 300);
    } catch (err: any) {
      Alert.alert("Logout failed", err.message);
    }
  };

  const navigateAndClose = (path: string) => {
    setVisible(false); // close drawer
    router.push(path);
  };

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity style={styles.hamburger} onPress={() => setVisible(true)}>
        <Text style={{ fontSize: 28 }}>☰</Text>
      </TouchableOpacity>

      {/* Drawer Modal */}
      <Modal transparent visible={visible} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.drawer, { width: drawerWidth }]}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../assets/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                {/* Drawer Buttons */}
                <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/dashboard")}>
                  <Text style={styles.menuText}>🏠 Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/booking/bookingForm")}>
                  <Text style={styles.menuText}>🛠 Request Service</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/booking/bookings")}>
                  <Text style={styles.menuText}>📄 View Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/screens/settings")}>
                  <Text style={styles.menuText}>⚙️ Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuBtn, { backgroundColor: "#FF3333" }]} onPress={handleLogout}>
                  <Text style={styles.menuText}>🚪 Sign Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)", // semi-transparent background
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  drawer: {
    backgroundColor: "#111",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 15,
    height: "60%", // drawer height is 60% of screen
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 100,
  },
  menuBtn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  menuText: {
    color: "#FFEB3B",
    fontWeight: "700",
    fontSize: 16,
  },
});
