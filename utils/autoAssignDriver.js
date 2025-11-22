// mobile/utils/autoAssignDriver.js
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// Automatically assigns an available driver to a new booking
export async function assignDriverAutomatically(bookingId) {
  try {
    console.log("🚚 Looking for available drivers...");
    const driversRef = collection(db, "drivers");
    const availableQuery = query(driversRef, where("status", "==", "Available"));
    const snapshot = await getDocs(availableQuery);

    if (snapshot.empty) {
      console.warn("⚠️ No available drivers found.");
      await updateDoc(doc(db, "bookings", bookingId), { status: "pending" });
      return;
    }

    // Pick the first available driver (later we’ll make this based on distance)
    const driverDoc = snapshot.docs[0];
    const driverId = driverDoc.id;

    // Assign booking to that driver
    await updateDoc(doc(db, "bookings", bookingId), {
      assignedDriver: driverId,
      status: "assigned",
    });

    // Update driver status
    await updateDoc(doc(db, "drivers", driverId), {
      status: "On Job",
      currentBookingId: bookingId,
    });

    console.log(`✅ Assigned driver ${driverId} to booking ${bookingId}`);
  } catch (err) {
    console.error("❌ Error assigning driver:", err);
  }
}
