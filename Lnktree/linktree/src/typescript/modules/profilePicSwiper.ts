export function initProfilePicSwiper(): void {
  document.querySelectorAll('.profile-pic-swiper').forEach((container) => {
    const slides = container.querySelectorAll('.profile-pic-slide') as NodeListOf<HTMLElement>;
    if (slides.length < 2) return;

    let current = 0;
    let startX = 0;

    function show(index: number): void {
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      current = index;
    }

    container.addEventListener('click', () => {
      show((current + 1) % slides.length);
    });

    container.addEventListener('touchstart', (e) => {
      startX = (e as TouchEvent).touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const dx = (e as TouchEvent).changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 30) {
        show(dx < 0 ? Math.min(current + 1, slides.length - 1) : Math.max(current - 1, 0));
      }
    }, { passive: true });
  });
}
