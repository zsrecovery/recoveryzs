import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Start somewhere in the UK
let truck1 = { latitude: 51.509865, longitude: -0.118092 }; // London
let truck2 = { latitude: 53.483959, longitude: -2.244644 }; // Manchester

export const simulateTowTrucks = () => {
  console.log("🚚 Starting Tow Truck simulation...");

  setInterval(async () => {
    // Add small random movements
    truck1.latitude += (Math.random() - 0.5) * 0.01;
    truck1.longitude += (Math.random() - 0.5) * 0.01;

    truck2.latitude += (Math.random() - 0.5) * 0.01;
    truck2.longitude += (Math.random() - 0.5) * 0.01;

    try {
      await setDoc(doc(db, "towTrucks", "truck1"), {
        ...truck1,
        lastUpdated: new Date().toISOString(),
      });
      await setDoc(doc(db, "towTrucks", "truck2"), {
        ...truck2,
        lastUpdated: new Date().toISOString(),
      });
      console.log("✅ Updated tow truck positions");
    } catch (err) {
      console.error("❌ Error updating truck:", err);
    }
  }, 5000); // every 5 seconds
};
