import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAs9EOxe7atELBz6mBXWcN1KmwF94QwOGk",
  authDomain: "pommepoire195.firebaseapp.com",
  projectId: "pommepoire195",
  storageBucket: "pommepoire195.firebasestorage.app",
  messagingSenderId: "254392102121",
  appId: "1:254392102121:web:59af4bf137a6a38e97d478"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
