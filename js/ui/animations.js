// ============================================================
// UI ANIMATIONS — small reusable animation helpers:
// animated counters, progress bar fills, particle bursts,
// floating "+XP" popups.
// ============================================================

export function animateCounter(el, from, to, { duration = 800, formatter = (v) => Math.round(v).toString() } = {}) {
  if (!el) return;
  const start = performance.now();
  const delta = to - from;

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
    el.textContent = formatter(from + delta * eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function setBarWidth(el, percent) {
  if (!el) return;
  requestAnimationFrame(() => {
    el.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  });
}

export function spawnParticles(container, count = 26) {
  if (!container) return;
  container.innerHTML = "";
  const colors = ["#FFC94C", "#4C8DFF", "#B463FF", "#2BD9E6"];

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 160;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    p.style.setProperty("--px", `${px}px`);
    p.style.setProperty("--py", `${py}px`);
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 120}ms`;
    container.appendChild(p);
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 1400);
}

// Floating "+XP" popup anchored inside a positioned parent element.
export function spawnXpPopup(anchorEl, amount) {
  if (!anchorEl) return;
  const popup = document.createElement("div");
  popup.className = "xp-popup";
  popup.textContent = `+${amount} XP`;
  anchorEl.appendChild(popup);
  setTimeout(() => popup.remove(), 1150);
}
