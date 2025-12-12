import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { GlobalContext } from '../GlobalContext';
import { db, auth } from '../firebaseConfig';
import { doc, collection, getDocs, getDoc, query, where } from 'firebase/firestore';

export default function Dashboard() {
  const navigation = useNavigation();
  const { setBookingsData, setUserData } = useContext(GlobalContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [refreshing, setRefreshing] = useState(false);

  const services = [
    { name: 'Vehicle Recovery', icon: <FontAwesome5 name="truck-moving" size={28} color="#000" />, description: 'Professional towing & recovery for all vehicles.' },
    { name: 'Tyre Change', icon: <FontAwesome5 name="car-side" size={28} color="#000" />, description: 'Fast tyre replacement wherever you are.' },
    { name: 'Roadside Assistance', icon: <MaterialIcons name="miscellaneous-services" size={28} color="#000" />, description: 'Immediate roadside help for breakdowns.' },
    { name: 'Jump Starting', icon: <Ionicons name="battery-charging" size={28} color="#000" />, description: 'Quick jump-start service for dead batteries.' },
    { name: 'Vehicle Delivery', icon: <MaterialIcons name="local-shipping" size={28} color="#000" />, description: 'Doorstep vehicle delivery wherever you need it.' },
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
        Animated.timing(cardSlideAnims[i], {
          toValue: 0,
          duration: 600,
          delay: i * 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardFadeAnims[i], {
          toValue: 1,
          duration: 600,
          delay: i * 120,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(120, animations).start();
  };

  const fetchAllData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserData(userSnap.data());

      const bookingsSnap = await getDocs(
        query(collection(db, 'bookings'), where('userId', '==', user.uid))
      );

      const bookingsArr: any[] = [];
      bookingsSnap.forEach(doc => bookingsArr.push({ id: doc.id, ...doc.data() }));
      setBookingsData(bookingsArr);

    } catch (err: any) {
      console.error("Error fetching data:", err.message);
    }
  };

  useEffect(() => {
    animateServices();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    cardSlideAnims.forEach(a => a.setValue(40));
    cardFadeAnims.forEach(a => a.setValue(0));

    await fetchAllData();
    animateServices();
    setRefreshing(false);
  }, []);

  return (
    <ImageBackground source={require('../assets/road3.png')} style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={() => (navigation as any).toggleDrawer()}>
          <Ionicons name="menu" size={32} color="#fff" style={styles.menuIcon} />
        </TouchableWithoutFeedback>

        <View style={styles.centerHeader}>
          <Text style={styles.title}>ZS Recovery</Text>
          <Text style={styles.caption}>Fast • Reliable • Professional</Text>
        </View>
      </View>

      {/* BANNER IMAGE */}
      <View style={{ width: "100%", alignItems: "center", marginTop: 20 }}>
        <ImageBackground
          source={require("../assets/24hrbanner.png")}
          style={{ width: "70%", height: 140, borderRadius: 16, overflow: "hidden" }}
          resizeMode="cover"
        />
      </View>

      {/* SERVICES */}
      <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <Text style={styles.sectionHead}>Services</Text>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {services.map((service, index) => (
            <TouchableWithoutFeedback
              key={index}
              onPressIn={() => Animated.spring(scaleAnims[index], {
                toValue: 1.05,
                useNativeDriver: true
              }).start()}
              onPressOut={() => Animated.spring(scaleAnims[index], {
                toValue: 1,
                useNativeDriver: true
              }).start()}
            >
              <Animated.View
                style={[
                  styles.serviceBtn,
                  {
                    opacity: cardFadeAnims[index],
                    transform: [
                      { translateY: cardSlideAnims[index] },
                      { scale: scaleAnims[index] }
                    ]
                  }
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  menuIcon: {
    position: "absolute",
    left: 20,
    top: 55,
    zIndex: 999,
  },

  centerHeader: {
    alignItems: "center",
    marginTop: 20,
  },

  title: { fontSize: 26, color: '#00FF7F', fontWeight: '800' },
  caption: { color: '#FFE066', fontSize: 13, marginTop: -3 },

  body: { paddingHorizontal: 20, marginTop: 40 },

  sectionHead: { fontSize: 22, color: '#fff', marginBottom: 20, fontWeight: '700' },

  serviceBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderColor: '#FFE066',
    borderWidth: 2,
    paddingVertical: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  iconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: '#FFE066',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },

  serviceText: { fontSize: 18, color: '#000', fontWeight: '700' },
  serviceDesc: { fontSize: 14, color: '#000', marginTop: 4 },
});
