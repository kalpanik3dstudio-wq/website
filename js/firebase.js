// public/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

// --- YOUR NEW CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAnQN-DoJnb3S9wmIseNH5Cimid09Rt2WE",
  authDomain: "kalpnik3d.firebaseapp.com",
  projectId: "kalpnik3d",
  storageBucket: "kalpnik3d.firebasestorage.app",
  messagingSenderId: "92040077364",
  appId: "1:92040077364:web:06a8eeb70b136831c4aa61",
  measurementId: "G-QHY5RJ8PMW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("Firebase initialised with Project ID:", firebaseConfig.projectId);

export { app, auth, db, storage, onAuthStateChanged };