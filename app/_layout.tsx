// app/_layout.tsx
import React from "react";
import { Drawer } from "expo-router/drawer";
import DrawerNavigator from "./DrawerNavigator";
import GlobalErrorBoundary from './GlobalErrorBoundary'; 
import { GlobalProvider } from './../GlobalContext'; 
export default function RootLayout() {
  return (
    <GlobalErrorBoundary> 
      <GlobalProvider>
    <Drawer
      drawerContent={() => <DrawerNavigator />}
      screenOptions={{
        drawerStyle: { backgroundColor: "#111", width: 250 },
        drawerActiveTintColor: "#00FF7F",
        drawerInactiveTintColor: "#9c8b8bff",
        headerShown: false,
      }}
    />
    </GlobalProvider>
    </GlobalErrorBoundary>
  );
}
