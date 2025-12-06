import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

// This is the Tabs Layout specifically for users with the 'client' (passenger) role.
// It organizes the main navigation for the client application.
export default function ClientTabLayout() {
  // Define simple colors for the tabs
  const activeColor = '#00C853'; // Bright green for active tab
  const inactiveColor = '#888'; // Gray for inactive tab

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarStyle: {
            backgroundColor: '#1E1E1E', // Dark background for the tab bar
            borderTopColor: '#333',
        },
      }}
    >
      {/* The primary screen for requesting a ride. 
        This maps to app/(tabs)/client/Home.tsx
      */}
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Ride',
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="car-sport-outline" color={color} />
          ),
        }}
      />
      
      {/* Placeholder for the user's booking/history screen */}
      <Tabs.Screen
        name="BookingScreen"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="calendar-outline" color={color} />
          ),
        }}
      />
      
      {/* New tab for managing client services, subscriptions, or settings */}
      <Tabs.Screen
        name="ServicesScreen"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="settings-outline" color={color} />
          ),
        }}
      />
      
      {/* Placeholder for the user's profile/account management screen */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="person-circle-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}