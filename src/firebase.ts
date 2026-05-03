import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHVURWb2jsHTBgZE5nlA4S86fLhtufcTI",
  authDomain: "questions-a5cb8.firebaseapp.com",
  projectId: "questions-a5cb8",
  storageBucket: "questions-a5cb8.firebasestorage.app",
  messagingSenderId: "940686230892",
  appId: "1:940686230892:web:b5760fcff83fe5167d9f49",
  measurementId: "G-2ER5ZW66G0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable Google sign-in with account picker
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function fetchQuestions() {
  const querySnapshot = await getDocs(collection(db, "questions"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
