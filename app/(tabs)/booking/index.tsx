// app/index.tsx
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Landing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user type from Firestore
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userType = userData?.userType;

            if (userType === "client") {
              router.replace("/(tabs)/booking/Home");
            } else if (userType === "driver") {
              router.replace("/booking/TowDriverScreen");
            } else {
              Alert.alert(
                "Error",
                "User type is invalid. Please contact support."
              );
              await auth.signOut();
              router.replace("/screens/Login");
            }
          } else {
            // If no user document exists
            Alert.alert(
              "Error",
              "User profile not found. Please complete registration."
            );
            await auth.signOut();
            router.replace("/screens/SignUp");
          }
        } catch (err) {
          console.error("Error fetching user type:", err);
          Alert.alert(
            "Error",
            "Something went wrong while logging in. Please try again."
          );
          await auth.signOut();
          router.replace("/screens/Login");
        }
      } else {
        // Not logged in yet, stay on landing page
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ marginTop: 10 }}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ImageBackground
        source={require("../../../assets/towtruck.jpg")}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
          />

          <Text style={styles.tagline}>
            Fast. Reliable. Professional Towing
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/screens/SignUp")}
            style={[styles.button, { backgroundColor: "#00C853" }]}
          >
            <Text style={[styles.buttonText, { color: "#FFF" }]}>📝 Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/screens/Login")}
            style={[styles.button, { backgroundColor: "#FFEB3B" }]}
          >
            <Text style={[styles.buttonText, { color: "#2E7D32" }]}>🔑 Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/screens/ForgotPassword")}>
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
  logo: {
    width: 260,
    height: 220,
    marginBottom: 20,
    resizeMode: "contain",
  },
  tagline: {
    color: "#FFEB3B",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  button: {
    width: "80%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: { fontWeight: "bold", fontSize: 18 },
  forgotText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFEB3B",
    textDecorationLine: "underline",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
