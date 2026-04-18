// Use Firebase compat layer - works better with React Native
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/functions";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAC-9fdxluPBTTeUAwrybwHTSVW-s4vaNc",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "aeris-citizen-app-16265.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "aeris-citizen-app-16265",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "aeris-citizen-app-16265.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "911233719309",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:911233719309:web:c6795ad4683d23afc944",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "C-EJVH10YDJ6",
};

// Initialize Firebase (compat handles re-initialization gracefully)
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

// React Native: disable web SDK auth persistence — native auth (@react-native-firebase/auth)
// owns the auth state. Using Persistence.LOCAL here would crash on sign-out
// because it tries to call localStorage.removeItem() which doesn't exist in RN.
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

const app = firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
// Functions scoped to asia-southeast1 where all AERIS Cloud Functions are deployed
const functions = firebase.app().functions('asia-southeast1');

export { app, auth, db, storage, functions, firebaseConfig };
