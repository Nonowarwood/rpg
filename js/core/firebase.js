// ============================================================
// FIREBASE — SDK initialization, loaded straight from Google's
// CDN as ES modules. Keeps the "no bundler, no npm" constraint:
// this is just another `.js` import, exactly like a local module.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDf2-isd6kbPXuwjy8vfUfgdJ6EQbcO07U",
  authDomain: "rpgv1-e5ead.firebaseapp.com",
  projectId: "rpgv1-e5ead",
  storageBucket: "rpgv1-e5ead.firebasestorage.app",
  messagingSenderId: "1011521895123",
  appId: "1:1011521895123:web:ccb82fa09f131c71ba3226",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
