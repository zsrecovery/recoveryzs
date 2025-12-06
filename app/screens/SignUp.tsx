// app/screens/SignUp.tsx
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
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  PhoneAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import Recaptcha from "@/components/Recaptcha";

export default function SignUp() {
  const router = useRouter();
  const auth = getAuth();

  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifier = useRef<any>(null);

  // ----- Email SignUp -----
  const handleEmailSignUp = async () => {
    if (!name || !email || !password) return Alert.alert("Error", "Please fill all fields");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        email,
        userType: "client",
        createdAt: Date.now(),
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)/booking/Home");
    } catch (err: any) {
      Alert.alert("Sign Up Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Phone OTP SignUp -----
  const handleSendOtp = async () => {
    if (!name || !phone) return Alert.alert("Error", "Enter your name and phone number.");
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
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        phone,
        userType: "client",
        createdAt: Date.now(),
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)/booking/Home");
    } catch (err: any) {
      Alert.alert("OTP Verification Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>

        <Recaptcha ref={recaptchaVerifier} />

        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setSignupMethod("email")}>
            <Text style={[styles.toggleText, signupMethod === "email" && styles.activeToggle]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSignupMethod("phone")} style={{ marginLeft: 20 }}>
            <Text style={[styles.toggleText, signupMethod === "phone" && styles.activeToggle]}>Phone</Text>
          </TouchableOpacity>
        </View>

        {signupMethod === "email" ? (
          <>
            <TextInput
              placeholder="Name"
              placeholderTextColor="#888"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ alignSelf: "flex-end", marginBottom: 20 }}>
              <Text style={{ color: "#00C853", fontWeight: "bold" }}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleEmailSignUp} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              placeholder="Name"
              placeholderTextColor="#888"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Phone (+254...)"
              placeholderTextColor="#888"
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
                  placeholderTextColor="#888"
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

        <TouchableOpacity onPress={() => router.push("/screens/Login")} style={{ marginTop: 20 }}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Login</Text>
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
  button: { width: "80%", height: 50, backgroundColor: "#00C853", borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  toggleContainer: { flexDirection: "row", marginBottom: 20 },
  toggleText: { color: "#888", fontSize: 18, fontWeight: "bold" },
  activeToggle: { color: "#00C853", textDecorationLine: "underline" },
  switchText: { color: "#000", fontSize: 16 },
  switchLink: { color: "#00C853", fontWeight: "bold" },
});
