import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your app's Firebase project configuration
// You can find these in your Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBIcNJixYcGvl2CgIg9FnD8oqzXmP7VhZU",
  authDomain: "agrostyle-436b8.firebaseapp.com",
  projectId: "agrostyle-436b8",
  storageBucket: "agrostyle-436b8.firebasestorage.app",
  messagingSenderId: "245314025120",
  appId: "1:245314025120:web:43158acd33e9b0d29dbbc5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
