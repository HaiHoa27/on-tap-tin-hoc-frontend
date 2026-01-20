// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRJA4SaVjqqXbXXRNYBdLYVk-N09Fx6V0",
  authDomain: "on-tap-tin-hoc-native.firebaseapp.com",
  projectId: "on-tap-tin-hoc-native",
  storageBucket: "on-tap-tin-hoc-native.appspot.com",
  messagingSenderId: "769920425444",
  appId: "1:769920425444:web:8a5be7b77c5ae417d3fbf1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
