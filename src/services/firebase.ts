// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query } from 'firebase/firestore';
import { DayLog, UserSettings } from '../types';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB1YG5kdeFQVThev31-1U3-0Qt12P5l4Ao",
  authDomain: "diarioalimentar-6b9fa.firebaseapp.com",
  projectId: "diarioalimentar-6b9fa",
  storageBucket: "diarioalimentar-6b9fa.firebasestorage.app",
  messagingSenderId: "261274181906",
  appId: "1:261274181906:web:571791fb3d08fd2c5c13cb"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper para obter ID único
export const getUserId = (): string => {
  let storedId = localStorage.getItem('nutritrack_userid');
  if (!storedId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        storedId = crypto.randomUUID();
    } else {
        storedId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    localStorage.setItem('nutritrack_userid', storedId);
  }
  return storedId;
};

// Helper para definir ID manualmente (Sincronização)
export const setUserId = (id: string) => {
    localStorage.setItem('nutritrack_userid', id);
};

// Busca dados do usuário
export const fetchUserData = async (userId: string) => {
  try {
    const settingsRef = doc(db, 'users', userId);
    const settingsSnap = await getDoc(settingsRef);
    let settings = null;
    if (settingsSnap.exists()) {
      settings = settingsSnap.data() as UserSettings;
    }

    const logsRef = collection(db, 'users', userId, 'logs');
    const logsSnap = await getDocs(query(logsRef));
    const logs = logsSnap.docs.map(d => d.data() as DayLog);

    return { settings, logs };
  } catch (error) {
    console.error("Erro ao buscar dados do Firebase:", error);
    throw error;
  }
};

// Salva configurações
export const saveUserSettings = async (userId: string, settings: UserSettings) => {
  try {
    await setDoc(doc(db, 'users', userId), settings);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    throw error;
  }
};

// Salva log diário
export const saveDayLog = async (userId: string, log: DayLog) => {
  try {
    await setDoc(doc(db, 'users', userId, 'logs', log.date), log);
  } catch (error) {
    console.error("Erro ao salvar log diário:", error);
    throw error;
  }
};

// Exclui log diário
export const deleteDayLog = async (userId: string, date: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'logs', date));
  } catch (error) {
    console.error("Erro ao excluir log diário:", error);
    throw error;
  }
};