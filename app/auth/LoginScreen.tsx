// app/(auth)/LoginScreen.tsx
import React, { useEffect, useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet 
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/Dashboard");
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Missing info", "Please enter both email and password.");
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/Dashboard"); // navigate after login
    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return Alert.alert("Enter email", "Please enter your email first to reset password.");
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Password Reset", "Check your email for the reset link.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace("/index")}
      >
        <Ionicons name="arrow-back" size={24} color="#2E7D32" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Log In</Text>

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Password Input with Toggle */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>{loading ? "Logging in..." : "Log In"}</Text>
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Sign Up */}
      <TouchableOpacity onPress={() => router.push("/auth/SignUp")}>
        <Text style={styles.signupText}>New here? Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#FFFDE7" },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: { marginLeft: 8, fontSize: 16, color: "#2E7D32", fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "bold", color: "#2E7D32", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, borderColor: "#CCC", marginBottom: 12, backgroundColor: "#fff" },
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CCC", borderRadius: 10, marginBottom: 12, paddingRight: 10, backgroundColor: "#fff" },
  eyeButton: { padding: 6 },
  loginButton: { backgroundColor: "#2E7D32", padding: 15, borderRadius: 10, alignItems: "center" },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  forgotText: { marginTop: 15, textAlign: "center", color: "#00796B", fontWeight: "600" },
  signupText: { marginTop: 20, textAlign: "center", color: "#2E7D32", fontWeight: "600" },
});
