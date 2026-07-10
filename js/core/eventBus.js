// ============================================================
// EVENT BUS — minimal pub/sub used to decouple systems from UI.
// Systems emit events (e.g. "quest:completed"); UI modules subscribe.
// ============================================================

const listeners = new Map();

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => off(event, callback);
}

export function off(event, callback) {
  listeners.get(event)?.delete(callback);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((cb) => cb(payload));
}
