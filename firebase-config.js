import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlqe6nbmjfBv6B9K09Y9H5sL2j85E_crY",
  authDomain: "nexia-store.firebaseapp.com",
  projectId: "nexia-store",
  storageBucket: "nexia-store.firebasestorage.app",
  messagingSenderId: "703159032940",
  appId: "1:703159032940:web:4ad0cc5bca06e452f08c49",
  measurementId: "G-YENLL15GW2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);