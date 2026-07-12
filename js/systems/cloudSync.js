// ============================================================
// CLOUD SYNC — mirrors the local `state` singleton to Firestore
// once a user is signed in with Google, so progress follows them
// across devices. localStorage stays the source of truth for
// offline/guest play; this is a best-effort layer on top of it.
//
// Sync model (deliberately simple, no realtime listeners):
//   - On sign-in: if a cloud document already exists, it REPLACES
//     local state (cloud is authoritative once it exists). If not,
//     the current local/guest progress is pushed up as the first
//     save, so nothing is lost by signing in.
//   - After that, every local change is debounced and pushed to
//     Firestore. Other devices only pick it up the next time they
//     sign in there — not live — which is enough for a single-
//     player life-RPG and avoids realtime-listener feedback loops.
// ============================================================

import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from "../core/firebase.js";
import { state, persist, hydrateFromCloud } from "../core/state.js";
import { on, emit } from "../core/eventBus.js";

const PUSH_DEBOUNCE_MS = 1000;

let signedInUid = null;
let pushTimer = null;
// Set right before a cloud->local pull so that pull's own state:changed
// doesn't immediately get echoed straight back up as a redundant write.
let suppressNextPush = false;

function applyGoogleIdentity(user) {
  if (!state.profile.name || state.profile.name === "Joueur") {
    state.profile.name = user.displayName || state.profile.name;
  }
  // Applied *after* any cloud pull below, so a changed Google photo/email
  // always wins over whatever was cached in an older Firestore doc.
  state.profile.photoURL = user.photoURL || null;
  state.profile.email = user.email || null;
}

on("auth:changed", async (user) => {
  if (!user) {
    signedInUid = null;
    return;
  }
  signedInUid = user.uid;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      suppressNextPush = true;
      hydrateFromCloud(snap.data());
    }
    applyGoogleIdentity(user);
    persist();
    if (!snap.exists()) {
      await pushStateToCloud(); // first-ever save for this account, don't wait on the debounce
    }
    emit("cloud:ready");
  } catch (err) {
    console.warn("[Ascend] Cloud sync failed to load.", err);
    emit("cloud:error", err);
  }
});

on("state:changed", () => {
  if (!signedInUid) return;
  if (suppressNextPush) {
    suppressNextPush = false;
    return;
  }
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushStateToCloud, PUSH_DEBOUNCE_MS);
});

async function pushStateToCloud() {
  if (!signedInUid) return;
  try {
    await setDoc(doc(db, "users", signedInUid), state);
  } catch (err) {
    console.warn("[Ascend] Cloud sync failed to save.", err);
  }
}
