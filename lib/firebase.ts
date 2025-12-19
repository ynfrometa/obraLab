// Import the functions you need from the SDKs you need
import { Analytics, getAnalytics } from 'firebase/analytics';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAxgztRKA7TXR1wNlpAF97hhcZ3HAGMMU8',
  authDomain: 'constructdb-2616b.firebaseapp.com',
  databaseURL: 'https://constructdb-2616b-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'constructdb-2616b',
  storageBucket: 'constructdb-2616b.firebasestorage.app',
  messagingSenderId: '412626142334',
  appId: '1:412626142334:web:c5d52d46e0a19c8355c42f',
  measurementId: 'G-NKRCYP6V0E',
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let analytics: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
  // En caso de error, db será undefined
  db = undefined;
}

export { db as database, analytics };
export default app;

