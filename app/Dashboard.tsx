import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
} from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  ImageBackground,
  Easing,
  Dimensions,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { GlobalContext } from "../GlobalContext";
import { db, auth } from "../firebaseConfig";
import {
  doc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
} from "firebase/firestore";

/* ---------------- DRAWER OVERLAY COMPONENT ---------------- */
function DrawerOverlay({ visible, setVisible }: { visible: boolean; setVisible: (v: boolean) => void }) {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth * 0.65;

  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;

  // Animate drawer in/out
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -drawerWidth,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setVisible(false);
      router.replace("/");
      setTimeout(() => Alert.alert("Logged out", "You have been logged out."), 300);
    } catch (err: any) {
      Alert.alert("Logout failed", err.message);
    }
  };

  const navigateAndClose = (path: string) => {
    setVisible(false);
    router.push(path);
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.drawer, { width: drawerWidth, left: slideAnim }]}>
              <View style={styles.logoContainer}>
                <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
              </View>

              <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/Dashboard")}>
                <Text style={styles.menuText}>🏠 Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/booking/BookingForm")}>
                <Text style={styles.menuText}>🛠 Request Service</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/booking/bookings")}>
                <Text style={styles.menuText}>📄 View Bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuBtn} onPress={() => navigateAndClose("/screens/Settings")}>
                <Text style={styles.menuText}>⚙️ Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuBtn, { backgroundColor: "#FF3333" }]} onPress={handleLogout}>
                <Text style={styles.menuText}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ---------------- DASHBOARD COMPONENT ---------------- */
export default function Dashboard() {
  const router = useRouter();
  const global = useContext(GlobalContext);
  if (!global) return null;
  const { setBookingsData, setUserData } = global;

  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const services = [
    { name: "Vehicle Recovery", icon: <FontAwesome5 name="truck-moving" size={28} color="#000" />, description: "Professional towing & recovery for all vehicles." },
    { name: "Tyre Change", icon: <FontAwesome5 name="car-side" size={28} color="#000" />, description: "Fast tyre replacement wherever you are." },
    { name: "Roadside Assistance", icon: <MaterialIcons name="miscellaneous-services" size={28} color="#000" />, description: "Immediate roadside help for breakdowns." },
    { name: "Jump Starting", icon: <Ionicons name="battery-charging" size={28} color="#000" />, description: "Quick jump-start service for dead batteries." },
    { name: "Vehicle Delivery", icon: <MaterialIcons name="local-shipping" size={28} color="#000" />, description: "Doorstep vehicle delivery wherever you need it." },
  ];

  const scaleAnims = useRef(services.map(() => new Animated.Value(1))).current;
  const cardSlideAnims = useRef(services.map(() => new Animated.Value(40))).current;
  const cardFadeAnims = useRef(services.map(() => new Animated.Value(0))).current;

  const animateServices = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    const animations = services.map((_, i) =>
      Animated.parallel([
        Animated.timing(cardSlideAnims[i], { toValue: 0, duration: 600, delay: i * 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(cardFadeAnims[i], { toValue: 1, duration: 600, delay: i * 120, useNativeDriver: true }),
      ])
    );
    Animated.stagger(120, animations).start();
  };

  const fetchAllData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserData(userSnap.data());

      const bookingsSnap = await getDocs(query(collection(db, "bookings"), where("userId", "==", user.uid)));
      const bookingsArr: any[] = [];
      bookingsSnap.forEach((doc) => bookingsArr.push({ id: doc.id, ...doc.data() }));
      setBookingsData(bookingsArr);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err.message);
    }
  };

  useEffect(() => {
    animateServices();
    fetchAllData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    cardSlideAnims.forEach((a) => a.setValue(40));
    cardFadeAnims.forEach((a) => a.setValue(0));

    await fetchAllData();
    animateServices();
    setRefreshing(false);
  }, []);

  return (
    <ImageBackground source={require("../assets/road3.png")} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={32} color="#fff" style={styles.menuIcon} />
        </TouchableWithoutFeedback>

        <View style={styles.centerHeader}>
          <Text style={styles.title}>ZS Recovery</Text>
          <Text style={styles.caption}>Fast • Reliable • Professional</Text>
        </View>
      </View>

      {/* DRAWER */}
      <DrawerOverlay visible={drawerVisible} setVisible={setDrawerVisible} />

      {/* BANNER */}
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <ImageBackground
          source={require("../assets/24hrbanner.png")}
          style={{ width: "70%", height: 140, borderRadius: 16, overflow: "hidden" }}
          resizeMode="cover"
        />
      </View>

      {/* SERVICES */}
      <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionHead}>Services</Text>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {services.map((service, index) => (
            <TouchableWithoutFeedback
              key={index}
              onPressIn={() => Animated.spring(scaleAnims[index], { toValue: 1.05, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true }).start()}
            >
              <Animated.View
                style={[
                  styles.serviceBtn,
                  {
                    opacity: cardFadeAnims[index],
                    transform: [{ translateY: cardSlideAnims[index] }, { scale: scaleAnims[index] }],
                  },
                ]}
              >
                <View style={styles.iconWrapper}>{service.icon}</View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.serviceText}>{service.name}</Text>
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={26} color="#000" />
              </Animated.View>
            </TouchableWithoutFeedback>
          ))}
        </ScrollView>
      </Animated.View>
    </ImageBackground>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: { paddingTop: 60, paddingHorizontal: 20, alignItems: "center" },
  menuIcon: { position: "absolute", left: 20, top: 55 },
  centerHeader: { alignItems: "center", marginTop: 20 },
  title: { fontSize: 26, color: "#00FF7F", fontWeight: "800" },
  caption: { color: "#FFE066", fontSize: 13, marginTop: -3 },
  body: { paddingHorizontal: 20, marginTop: 40 },
  sectionHead: { fontSize: 22, color: "#fff", marginBottom: 20, fontWeight: "700" },
  serviceBtn: { backgroundColor: "#fff", borderColor: "#FFE066", borderWidth: 2, paddingVertical: 20, borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 15, marginBottom: 16, elevation: 4 },
  iconWrapper: { width: 50, height: 50, backgroundColor: "#FFE066", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  serviceText: { fontSize: 18, color: "#000", fontWeight: "700" },
  serviceDesc: { fontSize: 14, color: "#000", marginTop: 4 },

  /* DRAWER STYLES */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-start", alignItems: "flex-start" },
  drawer: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#111", borderTopRightRadius: 20, borderBottomRightRadius: 20, paddingTop: 20, paddingHorizontal: 15 },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: { width: 200, height: 180 },
  menuBtn: { backgroundColor: "#2E7D32", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginBottom: 15 },
  menuText: { color: "#FFEB3B", fontWeight: "700", fontSize: 16 },
});
