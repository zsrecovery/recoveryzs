import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator 
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "@/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function SignUp() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (pass: string) => {
    if (pass.length < 6) return "Weak";
    if (pass.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)) return "Medium";
    if (pass.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)) return "Strong";
    return "Weak";
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(checkPasswordStrength(text));
  };

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !phone) {
      return Alert.alert("Missing info", "Please fill all fields.");
    }

    // UK phone validation
    const phoneRegex = /^(?:\+44|0)7\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return Alert.alert("Invalid phone", "Please enter a valid UK phone number.");
    }

    if (passwordStrength === "Weak") {
      return Alert.alert(
        "Weak password",
        "Password must be at least 6 characters, include letters and numbers."
      );
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        firstName,
        lastName,
        email,
        phone,
        role: "client",
        createdAt: Date.now(),
      });

      Alert.alert("Success", "Account created!");
      router.replace("/Dashboard");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
  style={{ marginBottom: 20, flexDirection: "row", alignItems: "center" }}
  onPress={() => router.replace("/Dashboard")} // absolute route to landing page
>
  <Ionicons name="arrow-back" size={24} color="#2E7D32" />
  <Text style={{ marginLeft: 8, fontSize: 16, color: "#2E7D32", fontWeight: "600" }}>
    Back
  </Text>
</TouchableOpacity>

      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor="#777"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor="#777"
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#777"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password with eye toggle */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#777"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={handlePasswordChange}
        />
        <TouchableOpacity 
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#777"
          />
        </TouchableOpacity>
      </View>

      {password.length > 0 && (
        <Text style={{ 
          marginBottom: 10, 
          color: passwordStrength === "Strong" ? "green" : passwordStrength === "Medium" ? "orange" : "red" 
        }}>
          Password strength: {passwordStrength}
        </Text>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignUp} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFEB3B" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/screens/Login")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 25,
    backgroundColor: "#F9F9F9"
  },
  title: { 
    fontSize: 30, 
    fontWeight: "bold", 
    marginBottom: 25, 
    textAlign: "center", 
    color: "#2E7D32"
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 14, 
    borderColor: "#BDBDBD", 
    backgroundColor: "#FFF"
  },
  passwordWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    paddingRight: 45, // leave space for the eye
    borderColor: "#BDBDBD",
    backgroundColor: "#FFF",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  button: { 
    backgroundColor: "#2E7D32", 
    padding: 15, 
    borderRadius: 12, 
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3
  },
  buttonText: { 
    color: "#FFEB3B", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  link: { 
    marginTop: 20, 
    textAlign: "center", 
    color: "#2E7D32", 
    fontWeight: "600",
    fontSize: 15
  }
});
