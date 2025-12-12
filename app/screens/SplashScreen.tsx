import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      router.replace('/app/index'); // go to landing/index after splash
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
        Fast • Reliable • Professional Towing
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 200, height: 200, marginBottom: 20 },
  tagline: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
});
