import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig"; // make sure you import your Firebase auth
import { onAuthStateChanged } from "firebase/auth";

export default function Landing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // loading state to wait for auth check

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in, redirect to your dashboard/home
        router.replace("/dashboard"); // change to your logged-in route
      } else {
        setLoading(false); // allow landing page to render
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFF" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ImageBackground
        source={require("../assets/towtruck.jpg")}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.tagline}>Fast. Reliable. Professional Vehicle Rescue.</Text>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={() => router.push("/auth/SignUp")}
            style={[styles.button, { backgroundColor: "#00C853" }]}
          >
            <Text style={[styles.buttonText, { color: "#FFF" }]}>📝 Sign Up</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={() => router.push("/auth/LoginScreen")}
            style={[styles.button, { backgroundColor: "#FFEB3B" }]}
          >
            <Text style={[styles.buttonText, { color: "#2E7D32" }]}>🔑 Login</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push("/auth/ForgotPassword")}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, height: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logo: { width: 260, height: 220, marginBottom: 20, resizeMode: "contain" },
  tagline: { color: "#FFEB3B", fontSize: 22, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  button: { width: "80%", padding: 15, borderRadius: 10, alignItems: "center", marginVertical: 10 },
  buttonText: { fontWeight: "bold", fontSize: 18 },
  forgotText: { marginTop: 12, fontSize: 16, fontWeight: "bold", color: "#FFEB3B", textDecorationLine: "underline" },
});
