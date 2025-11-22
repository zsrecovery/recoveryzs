import * as Location from "expo-location";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

let intervalHandle = null;

export async function requestLocationPermissions() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function startLocationUpdates(truckId, frequencyMs = 5000) {
  if (!truckId) throw new Error("truckId required");

  stopLocationUpdates();
  await sendSingleLocationUpdate(truckId);

  intervalHandle = setInterval(async () => {
    try {
      await sendSingleLocationUpdate(truckId);
    } catch (err) {
      console.warn("Location update failed", err);
    }
  }, frequencyMs);
}

export function stopLocationUpdates() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function sendSingleLocationUpdate(truckId) {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;

  await setDoc(
    doc(db, "towTrucks", truckId),
    {
      latitude,
      longitude,
      status: "moving",
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
}
