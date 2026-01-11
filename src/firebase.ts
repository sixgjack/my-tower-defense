import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHVURWb2jsHTBgZE5nlA4S86fLhtufcTI",
  authDomain: "questions-a5cb8.firebaseapp.com",
  projectId: "questions-a5cb8",
  storageBucket: "questions-a5cb8.firebasestorage.app",
  messagingSenderId: "940686230892",
  appId: "1:940686230892:web:adf8a922c9781c887d9f49",
  measurementId: "G-K4C7B0EZNG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function fetchQuestions() {
  const querySnapshot = await getDocs(collection(db, "questions"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}