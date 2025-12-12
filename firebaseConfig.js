import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgwRCkZsPUcv0x4cFZN-4T3DJNWOaVXbg",
  authDomain: "zs-recovery.firebaseapp.com",
  projectId: "zs-recovery",
  storageBucket: "zs-recovery.appspot.com", // FIXED
  messagingSenderId: "439700460060",
  appId: "1:439700460060:web:70a7bfd7932d97362305d9",
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
