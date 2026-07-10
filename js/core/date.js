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
