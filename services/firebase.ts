// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query } from 'firebase/firestore';
import { DayLog, UserSettings } from '../types';

// Configuração do Firebase fornecida pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyB1YG5kdeFQVThev31-1U3-0Qt12P5l4Ao",
  authDomain: "diarioalimentar-6b9fa.firebaseapp.com",
  projectId: "diarioalimentar-6b9fa",
  storageBucket: "diarioalimentar-6b9fa.firebasestorage.app",
  messagingSenderId: "261274181906",
  appId: "1:261274181906:web:571791fb3d08fd2c5c13cb"
};

// Inicializa o Firebase
// Using @ts-ignore to bypass potential type definition issues with Firebase v9
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper para obter ID único do dispositivo (ou recuperar o existente)
export const getUserId = (): string => {
  let storedId = localStorage.getItem('nutritrack_userid');
  if (!storedId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        storedId = crypto.randomUUID();
    } else {
        // Fallback simples para gerar um ID
        storedId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    localStorage.setItem('nutritrack_userid', storedId);
  }
  return storedId;
};

// Busca dados do usuário (Configurações e Logs)
export const fetchUserData = async (userId: string) => {
  try {
    // Busca Configurações
    const settingsRef = doc(db, 'users', userId);
    const settingsSnap = await getDoc(settingsRef);
    let settings = null;
    if (settingsSnap.exists()) {
      settings = settingsSnap.data() as UserSettings;
    }

    // Busca Logs (Diário)
    const logsRef = collection(db, 'users', userId, 'logs');
    const logsSnap = await getDocs(query(logsRef));
    const logs = logsSnap.docs.map(d => d.data() as DayLog);

    return { settings, logs };
  } catch (error) {
    console.error("Erro ao buscar dados do Firebase:", error);
    throw error;
  }
};

// Salva as configurações do usuário
export const saveUserSettings = async (userId: string, settings: UserSettings) => {
  try {
    await setDoc(doc(db, 'users', userId), settings);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    throw error;
  }
};

// Salva um log diário (refeições e exercícios)
export const saveDayLog = async (userId: string, log: DayLog) => {
  try {
    // Usa a data como ID do documento para evitar duplicatas no mesmo dia
    await setDoc(doc(db, 'users', userId, 'logs', log.date), log);
  } catch (error) {
    console.error("Erro ao salvar log diário:", error);
    throw error;
  }
};