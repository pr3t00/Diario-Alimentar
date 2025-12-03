import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query } from 'firebase/firestore';
import { DayLog, UserSettings } from '../types';

// Configuration from environment variables
// You must set these in your Vercel project settings
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
// We check for apiKey to avoid crashing immediately if env vars aren't set yet
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to get or create a persistent User ID for this browser
export const getUserId = (): string => {
    let storedId = localStorage.getItem('nutritrack_userid');
    if (!storedId) {
        storedId = crypto.randomUUID();
        localStorage.setItem('nutritrack_userid', storedId);
    }
    return storedId;
}

export const fetchUserData = async (userId: string) => {
    try {
        if (!process.env.FIREBASE_API_KEY) {
            throw new Error("Firebase not configured");
        }

        // Fetch Settings
        const settingsRef = doc(db, 'users', userId);
        const settingsSnap = await getDoc(settingsRef);
        let settings = null;
        if (settingsSnap.exists()) {
            settings = settingsSnap.data() as UserSettings;
        }

        // Fetch Logs
        const logsRef = collection(db, 'users', userId, 'logs');
        const logsSnap = await getDocs(query(logsRef));
        const logs = logsSnap.docs.map(d => d.data() as DayLog);

        return { settings, logs };
    } catch (error) {
        console.warn("Could not fetch from Firebase (check env vars):", error);
        throw error;
    }
}

export const saveUserSettings = async (userId: string, settings: UserSettings) => {
    if (!process.env.FIREBASE_API_KEY) return; 
    await setDoc(doc(db, 'users', userId), settings);
}

export const saveDayLog = async (userId: string, log: DayLog) => {
    if (!process.env.FIREBASE_API_KEY) return;
    await setDoc(doc(db, 'users', userId, 'logs', log.date), log);
}