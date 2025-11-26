// app/backgroundTasks/locationTask.js
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// 🔹 Must match the one used in TowDriverScreen
export const LOCATION_TASK_NAME = "background-location-task";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBgwRCkZsPUcv0x4cFZN-4T3DJNWOaVXbg",
  authDomain: "zs-recovery.firebaseapp.com",
  projectId: "zs-recovery",
  storageBucket: "zs-recovery.appspot.com",
  messagingSenderId: "439700460060",
  appId: "1:439700460060:web:70a7bfd7932d97362305d9",
};

// Initialize Firebase
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.log("Firebase already initialized");
}

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Location task error:", error);
    return;
  }

  if (data) {
    const { locations, driverId } = data;
    const location = locations[0];
    if (!location) return;

    const { latitude, longitude } = location.coords;

    if (!driverId) {
      console.log("⚠️ No driverId passed — skipping update");
      return;
    }

    try {
      await setDoc(
        doc(db, "drivers", driverId),
        {
          latitude,
          longitude,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`📍 Updated driver ${driverId}: ${latitude}, ${longitude}`);
    } catch (err) {
      console.error("❌ Firestore write error:", err);
    }
  }
});
