import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🚨 TASK NAME: Must match the name used in startLocationUpdatesAsync
export const LOCATION_TASK_NAME = "background-location-task";

// ----------------------------------------------------------------
// Firebase Initialization (Canvas Compliant)
// Uses the global variable __firebase_config to initialize Firebase
// ----------------------------------------------------------------
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ----------------------------------------------------------------
// Define the background task that runs periodically to send location updates
// ----------------------------------------------------------------
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Location Task Error:", error);
    return;
  }
  
  // 🚨 FIX: We remove the TypeScript 'as' assertion and use defensive runtime checks.
  // Expo's background location task returns data with a 'locations' array.
  if (!data || typeof data !== 'object' || !('locations' in data)) {
      console.warn("Location Task received invalid or empty data payload.");
      return;
  }
  
  const locations = data.locations;

  if (Array.isArray(locations) && locations.length > 0) {
    const latestLocation = locations[0];
    // We assume the structure is correct based on the Expo API
    const { latitude, longitude } = latestLocation.coords; 
    
    // Get driver ID from the current authenticated user context
    const driverId = auth.currentUser?.uid;

    if (!driverId) {
      console.warn("⚠️ Location Task: No authenticated user found, skipping update.");
      return;
    }

    try {
      // Update the driver's location in Firestore
      const driverRef = doc(db, "drivers", driverId);
      await updateDoc(driverRef, {
        latitude: latitude,
        longitude: longitude,
        lastSeen: serverTimestamp(), // Use serverTimestamp for accuracy
      });
      // console.log(`📍 Updated driver ${driverId}: ${latitude}, ${longitude}`); 

    } catch (err) {
      console.error("❌ Firestore write error in background task:", err);
    }
  }
});