// ============================================================
// AUTH SYSTEM — Google sign-in via Firebase Auth. The actual
// profile/data sync lives in cloudSync.js, which reacts to the
// "auth:changed" event this module emits.
// ============================================================

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth, googleProvider } from "../core/firebase.js";
import { emit } from "../core/eventBus.js";

export let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  emit("auth:changed", user);
});

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.warn("[Ascend] Google sign-in failed.", err);
    emit("auth:error", err);
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("[Ascend] Sign-out failed.", err);
  }
}
