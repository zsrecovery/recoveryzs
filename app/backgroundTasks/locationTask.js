import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { db, auth } from "../../firebaseConfig"; // <-- use singleton
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Task name
export const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Location Task Error:", error);
    return;
  }

  if (!data || !("locations" in data)) {
    console.warn("Location Task received invalid or empty data payload.");
    return;
  }

  const locations = data.locations;
  if (Array.isArray(locations) && locations.length > 0) {
    const latestLocation = locations[0];
    const { latitude, longitude } = latestLocation.coords;

    const driverId = auth.currentUser?.uid;
    if (!driverId) {
      console.warn("⚠️ No authenticated user, skipping location update.");
      return;
    }

    try {
      const driverRef = doc(db, "drivers", driverId);
      await updateDoc(driverRef, {
        latitude,
        longitude,
        lastSeen: serverTimestamp(),
      });
    } catch (err) {
      console.error("❌ Firestore write error:", err);
    }
  }
});
