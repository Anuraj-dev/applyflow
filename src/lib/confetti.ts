/** Lightweight confetti — no dependency. */
export function burstConfetti(count = 40) {
  if (typeof document === "undefined") return;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "pointer-events:none;position:fixed;inset:0;z-index:9999;overflow:hidden";
  document.body.appendChild(layer);
  const colors = ["#818cf8", "#a78bfa", "#34d399", "#f472b6", "#22d3ee"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = 6 + Math.random() * 8;
    p.style.cssText = `
      position:absolute;top:-10px;left:${Math.random() * 100}%;
      width:${size}px;height:${size * 0.6}px;
      background:${colors[i % colors.length]};
      border-radius:2px;opacity:0.95;
      transform:rotate(${Math.random() * 360}deg);
      animation:af-confetti ${1.2 + Math.random()}s ease-out forwards;
      animation-delay:${Math.random() * 0.2}s;
    `;
    layer.appendChild(p);
  }
  if (!document.getElementById("af-confetti-style")) {
    const style = document.createElement("style");
    style.id = "af-confetti-style";
    style.textContent = `
      @keyframes af-confetti {
        to {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  setTimeout(() => layer.remove(), 2500);
}
