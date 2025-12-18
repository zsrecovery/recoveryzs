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
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export default function Settings() {
  const router = useRouter();
  const [userData, setUserData] = useState<{ name?: string; userType?: string }>({});
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user info and total bookings count
  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) {
  Alert.alert("Session expired", "Please log in again.");
  router.replace("/");
  return;
}


    try {
      // Fetch user info
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserData(userSnap.data() as { name?: string; userType?: string });

      // Fetch total bookings count
      const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", user.uid));
      const snapshot = await getDocs(bookingsQuery);
      setTotalBookings(snapshot.size);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      Alert.alert("Error", err.message || "Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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
      await updateDoc(userRef, { userType: "driver" });
      Alert.alert("Success", "You are now registered as a driver!");
      setUserData(prev => ({ ...prev, userType: "driver" }));
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to become driver.");
    } finally {
      setLoadingDriver(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.push("/Dashboard")}>
        <Ionicons name="arrow-back" size={18} color="#00C853" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>Account Details</Text>

      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Information</Text>
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.value}>{userData.name || "N/A"}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{auth.currentUser?.email || "N/A"}</Text>

        <Text style={styles.label}>Account Type:</Text>
        <Text style={styles.value}>{userData.userType || "client"}</Text>

        <Text style={styles.label}>Total Bookings:</Text>
        <Text style={styles.value}>{totalBookings}</Text>
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
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
              size={18}
              color="#555"
            />
          </TouchableOpacity>
        </View>

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
              size={18}
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
  container: { padding: 12, backgroundColor: "#F5F5F5", flexGrow: 1 },
  backButton: { flexDirection: "row", alignItems: "center", marginTop: 70, marginBottom: 20, paddingLeft: 5 },
  backButtonText: { color: "#010904ff", fontSize: 20, fontWeight: "bold", marginLeft: 6 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#2E7D32", textAlign: "center" },
  section: {
    marginBottom: 15,
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6, color: "#00C853" },
  label: { fontSize: 12, fontWeight: "bold", color: "#333", marginTop: 6 },
  value: { fontSize: 13, color: "#555", marginTop: 2 },
  passwordInputContainer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  inputPassword: { flex: 1, borderWidth: 1, borderColor: "#CCC", borderRadius: 5, padding: 6, fontSize: 13 },
  eyeIcon: { position: "absolute", right: 6 },
  button: { backgroundColor: "#00C853", padding: 10, borderRadius: 6, marginTop: 10, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
});
