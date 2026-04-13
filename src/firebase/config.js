import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBzksCbiZPqjTmZDwyX3qwEYfiDfxi-pa8",
  authDomain: "naqha-6957f.firebaseapp.com",
  projectId: "naqha-6957f",
  storageBucket: "naqha-6957f.firebasestorage.app",
  messagingSenderId: "507826568339",
  appId: "1:507826568339:web:d4fde998b20fe2c86e6166"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
