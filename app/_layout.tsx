// app/_layout.tsx
import React from "react";
import { Drawer } from "expo-router/drawer";
import DrawerNavigator from "./DrawerNavigator";

export default function RootLayout() {
  return (
    <Drawer
      drawerContent={() => <DrawerNavigator />} // no props passed
      screenOptions={{
        drawerStyle: { backgroundColor: "#111", width: 250 },
        drawerActiveTintColor: "#00FF7F",
        drawerInactiveTintColor: "#fff",
        headerShown: false, // important: disables default drawer header
      }}
    />
  );
}
