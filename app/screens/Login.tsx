// app/screens/Login.tsx
import React, { useState, useRef } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithCredential,
  PhoneAuthProvider,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import Recaptcha from "@/components/Recaptcha";

export default function Login() {
  const router = useRouter();
  const auth = getAuth();

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifier = useRef<any>(null);

  // ----- Email Login -----
  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        await auth.signOut();
        return Alert.alert("Error", "User profile not found. Please complete registration.");
      }
      const userType = userSnap.data()?.userType;
      if (userType === "client") router.replace("/(tabs)/booking/Home");
      else if (userType === "driver") router.replace("/booking/TowDriverScreen");
      else {
        await auth.signOut();
        Alert.alert("Error", "User type invalid.");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Phone OTP Login -----
  const handleSendOtp = async () => {
    if (!phone) return Alert.alert("Error", "Enter your phone number.");
    setLoading(true);
    try {
      if (!recaptchaVerifier.current) return Alert.alert("Error", "Recaptcha not ready");
      const { signInWithPhoneNumber } = await import("firebase/auth");
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaVerifier.current);
      setConfirmationResult(confirmation);
      Alert.alert("OTP Sent", "Enter the OTP sent to your phone.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return Alert.alert("Error", "Enter OTP first.");
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otp
      );
      const userCredential = await signInWithCredential(auth, credential);
      const uid = userCredential.user.uid;
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        await auth.signOut();
        return Alert.alert("Error", "User profile not found.");
      }
      const userType = userSnap.data()?.userType;
      if (userType === "client") router.replace("/(tabs)/booking/Home");
      else if (userType === "driver") router.replace("/booking/TowDriverScreen");
      else {
        await auth.signOut();
        Alert.alert("Error", "User type invalid.");
      }
    } catch (err: any) {
      Alert.alert("OTP Verification Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Login</Text>

        <Recaptcha ref={recaptchaVerifier} />

        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => setLoginMethod("email")}>
            <Text style={[styles.toggleText, loginMethod === "email" && styles.activeToggle]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLoginMethod("phone")} style={{ marginLeft: 20 }}>
            <Text style={[styles.toggleText, loginMethod === "phone" && styles.activeToggle]}>Phone</Text>
          </TouchableOpacity>
        </View>

        {loginMethod === "email" ? (
          <>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#ccc"
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleEmailLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              placeholder="Phone (+254...)"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            {!confirmationResult ? (
              <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
              </TouchableOpacity>
            ) : (
              <>
                <TextInput
                  placeholder="Enter OTP"
                  placeholderTextColor="#ccc"
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity onPress={() => router.push("/screens/SignUp")} style={{ marginTop: 20 }}>
          <Text style={{ color: "#fff" }}>
            Don’t have an account? <Text style={{ color: "#00C853", fontWeight: "bold" }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "flex-start", alignItems: "center", paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20 },
  title: { color: "#00C853", fontSize: 26, fontWeight: "bold", marginBottom: 30 },
  input: { width: "80%", height: 50, backgroundColor: "#fff", borderWidth: 2, borderColor: "#FFEB3B", borderRadius: 10, paddingHorizontal: 15, color: "#000", marginBottom: 15 },
  passwordContainer: { flexDirection: "row", alignItems: "center", width: "80%", height: 50, backgroundColor: "#fff", borderWidth: 2, borderColor: "#FFEB3B", borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
  passwordInput: { flex: 1, color: "#000" },
  button: { width: "80%", height: 50, backgroundColor: "#00C853", borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  toggleText: { color: "#ccc", fontSize: 18, fontWeight: "bold" },
  activeToggle: { color: "#00C853", textDecorationLine: "underline" },
});
