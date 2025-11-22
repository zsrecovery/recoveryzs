// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SplashScreen from './app/screens/SplashScreen';
import SignUpScreen from './app/screens/SignUp';
import LoginScreen from './app/screens/Login';
import DrawerNavigator from './app/(tabs)/booking/DrawerNavigator'; // <-- Drawer for post-login

export type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  Login: undefined;
  MainApp: undefined; // DrawerNavigator
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainApp" component={DrawerNavigator} /> {/* post-login */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
