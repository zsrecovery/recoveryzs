// app/_layout.tsx
import React from "react";
import { Drawer } from "expo-router/drawer";
import DrawerNavigator from "./DrawerNavigator";
import GlobalErrorBoundary from './GlobalErrorBoundary'; // Import the new component
import { GlobalProvider } from './../GlobalContext';     // Import your existing context
export default function RootLayout() {
  return (
    <GlobalErrorBoundary> // 1. Catch any fatal errors that occur anywhere
      <GlobalProvider>      // 2. Provide data context to all children
    <Drawer
      drawerContent={() => <DrawerNavigator />} // no props passed
      screenOptions={{
        drawerStyle: { backgroundColor: "#111", width: 250 },
        drawerActiveTintColor: "#00FF7F",
        drawerInactiveTintColor: "#fff",
        headerShown: false, // important: disables default drawer header
      }}
    />
    </GlobalProvider>
    </GlobalErrorBoundary>
  );
}
