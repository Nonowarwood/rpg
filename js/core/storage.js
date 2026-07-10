// ============================================================
// STORAGE — thin wrapper around localStorage.
// Centralizing this makes it trivial to swap persistence later
// (e.g. IndexedDB, remote sync) without touching game logic.
// ============================================================

const SAVE_KEY = "ascend_save_v1";

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("[Ascend] Failed to load save, starting fresh.", err);
    return null;
  }
}

let saveTimer = null;

export function persistSave(data) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("[Ascend] Failed to persist save.", err);
    }
  }, 250);
}

export function persistSaveNow(data) {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[Ascend] Failed to persist save.", err);
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
