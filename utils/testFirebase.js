// utils/testFirebase.js
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function testFirebase() {
  try {
    const docRef = await addDoc(collection(db, "testCollection"), {
      test: "Firebase Connected!",
      timestamp: new Date(),
    });
    console.log("✅ Test document written with ID:", docRef.id);
  } catch (error) {
    console.error("❌ Firebase connection failed:", error);
  }
}
