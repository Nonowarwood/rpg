// ============================================================
// WEATHER SYSTEM — today's weather for the home topbar, rendered
// with the P5 sticker icons (assets/da/meteo-*.png). Uses the free
// open-meteo API (no key) + browser geolocation. Best-effort only:
// denied permission or a network failure just means no weather chip.
// ============================================================

const CACHE_KEY = "ascend_weather_v1";
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2h

// open-meteo WMO weather codes -> our four sticker kinds.
function kindForCode(code) {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "neige";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "pluie";
  if (code <= 1) return "soleil";
  return "nuage"; // 2, 3, fog…
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      reject,
      { timeout: 8000, maximumAge: 30 * 60 * 1000 }
    );
  });
}

// Resolves to { kind, temp } or null (never rejects).
export async function getTodayWeather() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    const { latitude, longitude } = await getPosition();
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}` +
      `&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const json = await res.json();

    const data = {
      kind: kindForCode(json.daily.weather_code[0]),
      temp: Math.round(json.daily.temperature_2m_max[0]),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    return data;
  } catch (err) {
    console.warn("[Ascend] météo indisponible.", err);
    return null;
  }
}
