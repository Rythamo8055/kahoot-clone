// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBK6YrVKRdivbwgFZhfWy_RO_u9qHzlYFE",
  authDomain: "for-backend-2a361.firebaseapp.com",
  projectId: "for-backend-2a361",
  storageBucket: "for-backend-2a361.appspot.com",
  messagingSenderId: "48916682423",
  appId: "1:48916682423:web:2800ee9cfc43d3f754df32",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, GoogleAuthProvider };
