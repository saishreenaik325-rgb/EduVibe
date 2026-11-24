import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDqKrZztC8iNQoBTep4vgesfBu1c59Ba-4",
  authDomain: "eduvibeapp-3cc90.firebaseapp.com",
  projectId: "eduvibeapp-3cc90",
  storageBucket: "eduvibeapp-3cc90.firebasestorage.app",
  messagingSenderId: "80455693536",
  appId: "1:80455693536:web:72bd322e0b695c2f45cc85"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);