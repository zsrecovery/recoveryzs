// app/navigation/DrawerNavigator.tsx
import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Screens
import HomeScreen from "../booking/Home";
import BookingForm from "../booking/BookingForm";
import MapScreen from "../booking/MapScreen";
import TowDriverScreen from "../booking/TowDriverScreen";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: "#2E7D32" },
        headerTintColor: "#FFF",
        headerTitleStyle: { fontWeight: "bold" },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{ marginLeft: 15 }}
          >
            <Text style={{ color: "#FFEB3B", fontSize: 28 }}>☰</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Make a Booking" component={BookingForm} />
      <Drawer.Screen name="Track a Tow" component={MapScreen} />
      <Drawer.Screen name="Driver Mode" component={TowDriverScreen} />
    </Drawer.Navigator>
  );
}
