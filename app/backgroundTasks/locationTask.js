import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔹 Must match the one used in TowDriverScreen
export const LOCATION_TASK_NAME = "background-location-task";

// ✅ Initialize Firebase (only once)
const firebaseConfig = {
  apiKey: "AIzaSyBgwRCkZsPUcv0x4cFZN-4T3DJNWOaVXbg",
  authDomain: "zs-recovery.firebaseapp.com",
  projectId: "zs-recovery",
  storageBucket: "zs-recovery.appspot.com",
  messagingSenderId: "439700460060",
  appId: "1:439700460060:web:70a7bfd7932d97362305d9",
};

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.log("Firebase already initialized");
}

// ✅ Define the background tracking task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Location task error:", error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (!location) return;

    const { latitude, longitude } = location.coords;

    // 🔹 Get the currently logged-in user (driver)
    const user = auth.currentUser;

    if (!user) {
      console.log("⚠️ No authenticated driver — skipping update");
      return;
    }

    const driverId = user.uid;

    try {
      // 🔸 Update the 'drivers' collection for real-time MapScreen
      await setDoc(
        doc(db, "drivers", driverId),
        {
          latitude,
          longitude,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      // 🔸 Optional: also update 'towTrucks' collection if you use it for other dashboards
      await setDoc(
        doc(db, "towTrucks", driverId),
        {
          latitude,
          longitude,
          status: "moving",
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
