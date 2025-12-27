// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import {
  getStorage,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAe7G_RDwSE56VM4pCVVnkc2tVXsnxKLgw",
  authDomain: "kalpnik3d-website.firebaseapp.com",
  projectId: "kalpnik3d-website",
  storageBucket: "kalpnik3d-website.firebasestorage.app",
  messagingSenderId: "819193971889",
  appId: "1:819193971889:web:8488288c6e6b7324d6ff80",
};

let app = null;
let auth = null;
let db = null;
let storage = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log("Firebase initialised");
} catch (err) {
  console.error("Firebase init error:", err);
}

export { app, auth, db, storage, onAuthStateChanged };
