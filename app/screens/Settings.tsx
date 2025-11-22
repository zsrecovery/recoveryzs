// app/screens/Settings.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(false);

  // Fetch user account details
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    try {
      setLoadingPassword(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to update password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleBecomeDriver = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoadingDriver(true);

      const userRef = doc(db, "users", user.uid);

      // Update userType to driver in Firestore
      await updateDoc(userRef, {
        userType: "driver",
      });

      Alert.alert("Success", "You are now registered as a driver!");
      setUserData((prev: any) => ({ ...prev, userType: "driver" }));
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to become driver.");
    } finally {
      setLoadingDriver(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(tabs)/booking/Home")}
      >
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>Account Details</Text>

      {/* Account Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Information</Text>
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.value}>{userData.name || "N/A"}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{auth.currentUser?.email || "N/A"}</Text>

        <Text style={styles.label}>Account Type:</Text>
        <Text style={styles.value}>{userData.userType || "client"}</Text>
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        {/* Current Password */}
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Current Password"
            secureTextEntry={!showCurrentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TouchableOpacity
            onPress={() => setShowCurrentPassword(prev => !prev)}
            style={styles.eyeIcon}
          >
            <MaterialCommunityIcons
              name={showCurrentPassword ? "eye-off" : "eye"}
              size={24}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="New Password"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(prev => !prev)}
            style={styles.eyeIcon}
          >
            <MaterialCommunityIcons
              name={showNewPassword ? "eye-off" : "eye"}
              size={24}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleChangePassword}
          disabled={loadingPassword}
        >
          {loadingPassword ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Become Driver Section */}
      {userData.userType !== "driver" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Become a Driver</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBecomeDriver}
            disabled={loadingDriver}
          >
            {loadingDriver ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Register as Driver</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.value}>Email: zsrecovery01@gmail.com</Text>
        <Text style={styles.value}>Phone / WhatsApp: +447835307112</Text>
        <Text style={styles.value}>Website: Coming up soon</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F5F5F5",
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: "#00C853",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2E7D32",
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#00C853",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: "#555",
    marginTop: 2,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  inputPassword: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  button: {
    backgroundColor: "#00C853",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
