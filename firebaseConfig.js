import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// 🔹 Your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBgwRCkZsPUcv0x4cFZN-4T3DJNWOaVXbg",
  authDomain: "zs-recovery.firebaseapp.com",
  projectId: "zs-recovery",
  storageBucket: "zs-recovery.appspot.com",
  messagingSenderId: "439700460060",
  appId: "1:439700460060:web:70a7bfd7932d97362305d9"
};

// 🔹 Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// ✅ Export them
export { app, auth, db, functions };
