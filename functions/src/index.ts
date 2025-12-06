import * as functions from "firebase-functions"; // v1 import
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Define the expected input type
interface BookingData {
  name: string;
  phone: string;
  phoneCode: string;
  vehicle?: string;
  service: string;
  pickup?: string;
  dropoff?: string;
  time?: string;
  note?: string;
  location?: { latitude: number; longitude: number } | null;
}

// v1 callable function
export const createBooking = functions.https.onCall(
  async (data: BookingData, context: functions.https.CallableContext) => {
    // Make sure context and auth exist
    if (!context || !context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to create a booking."
      );
    }

    const clientId = context.auth.uid;

    const { name, phone, phoneCode, vehicle, service, pickup, dropoff, time, note, location } = data;

    if (!name || !phone || !service) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name, phone, and service are required."
      );
    }

    const bookingData: any = {
      clientId,
      name,
      fullPhone: `${phoneCode}${phone}`,
      vehicle: vehicle || "",
      service,
      pickup: pickup || "",
      dropoff: dropoff || "",
      time: time || "",
      note: note || "",
      location: location || null,
      status: "requested",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedDriverId: null,
    };

    try {
      const bookingRef = await db.collection("bookings").add(bookingData);

      const driversSnap = await db.collection("drivers").where("status", "==", "Available").get();

      if (!driversSnap.empty) {
        const availableDrivers = driversSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        const assignedDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];

        await db.collection("drivers").doc(assignedDriver.id).update({
          status: "Busy",
          currentBookingId: bookingRef.id,
        });

        await bookingRef.update({
          assignedDriverId: assignedDriver.id,
          status: "assigned",
        });

        bookingData.assignedDriverId = assignedDriver.id;
        bookingData.status = "assigned";
      }

      return { bookingId: bookingRef.id, bookingData };
    } catch (err) {
      console.error("Error creating booking:", err);
      throw new functions.https.HttpsError("internal", "Failed to create booking.");
    }
  }
);
