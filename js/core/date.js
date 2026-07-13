// ============================================================
// DATE — local-calendar-day helpers shared by every system that
// cares about "today" (streaks, daily quest reset, counters).
// Deliberately NOT toISOString(), which reports the UTC date and
// would flip "today" at 1am/2am for most non-UTC users.
// ============================================================

function toLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toLocalISO(new Date());
}

export function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISO(d);
}

// Whole days from ISO date `a` to ISO date `b` (positive if b is
// later). Parses as local dates so DST shifts can't skew the count.
export function daysBetweenISO(a, b) {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da)) / 86400000);
}
