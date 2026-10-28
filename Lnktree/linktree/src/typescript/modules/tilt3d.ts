// 3D mouse-tilt — pointer-tracked perspective rotation on .link-section.
// Pure compositor work (transform on a perspective container). Disabled
// when lite-mode or `prefers-reduced-motion` is active. Throttled to one
// update per animation frame.

const MAX_DEG = 6;          // bounded so the tilt feels subtle, not gimmicky
const PERSPECTIVE = 1200;   // px

function isMotionAllowed(): boolean {
  if (document.body.classList.contains('lite-mode')) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

export function initTilt3d(): void {
  if (!isMotionAllowed()) return;

  const sections = document.querySelectorAll<HTMLElement>('.link-section');
  if (!sections.length) return;

  for (const section of Array.from(sections)) {
    let rafId = 0;
    let nextX = 0, nextY = 0;

    const apply = () => {
      rafId = 0;
      section.style.transform =
        `perspective(${PERSPECTIVE}px) rotateX(${nextY.toFixed(2)}deg) rotateY(${nextX.toFixed(2)}deg)`;
    };

    section.addEventListener('pointermove', (e) => {
      const rect = section.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      nextX = (px - 0.5) * 2 * MAX_DEG;
      nextY = -(py - 0.5) * 2 * MAX_DEG;
      if (!rafId) rafId = requestAnimationFrame(apply);
    }, { passive: true });

    const reset = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      section.style.transform = '';
    };
    section.addEventListener('pointerleave', reset, { passive: true });
    section.addEventListener('pointercancel', reset, { passive: true });
  }
}
