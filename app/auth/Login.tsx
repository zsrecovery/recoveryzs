import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-login if user already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/app/Dashboard");
    });
    return unsub;
  }, []);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Missing info", "Please fill all fields.");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/Dashboard");
    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) return Alert.alert("Enter email", "Enter email first.");
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Sent", "Check your email for reset link.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Login</Text>

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      {/* Password + Eye Toggle */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Password"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          <Text style={{ fontSize: 18 }}>
            {showPassword ? "🙈" : "👁️"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Please wait..." : "Log In"}
        </Text>
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity onPress={handleForgot}>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Sign Up */}
      <TouchableOpacity onPress={() => router.push("/screens/SignUp")}>
        <Text style={styles.signup}>New here? Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFDE7"
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    borderColor: "#CCC",
    marginBottom: 12,
    backgroundColor: "white"
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderColor: "#CCC",
    borderWidth: 1,
    marginBottom: 12,
    paddingRight: 10,
    backgroundColor: "white"
  },
  eyeButton: {
    padding: 6,
  },
  button: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  forgot: { marginTop: 15, textAlign: "center", color: "#00796B", fontWeight: "600" },
  signup: { marginTop: 20, textAlign: "center", color: "#2E7D32", fontWeight: "600" }
});
