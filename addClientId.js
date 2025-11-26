// addClientIdAdmin.js
import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addClientIdToBookings() {
  const bookingsRef = db.collection("bookings");
  const bookingsSnap = await bookingsRef.get();

  for (const bookingDoc of bookingsSnap.docs) {
    const data = bookingDoc.data();

    if (!data.clientId) {
      const clientId = "rpgV8QiCZHeQAD5Yxp8I8Bg64oX2"; // Replace with correct ID if needed
      await bookingsRef.doc(bookingDoc.id).update({ clientId });
      console.log(`Updated booking ${bookingDoc.id} with clientId ${clientId}`);
    } else {
      console.log(`Booking ${bookingDoc.id} already has clientId`);
    }
  }

  console.log("✅ All bookings processed.");
}

addClientIdToBookings().catch(console.error);
