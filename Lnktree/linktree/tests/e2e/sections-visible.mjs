// Playwright smoke test: every linktree section-box must show >=1 VISIBLE card
// with non-empty content after swiping through its slides. Counting DOM nodes
// is not enough - slides can exist but be empty, collapsed or transparent.
//
//   node tests/e2e/sections-visible.mjs [url]     (default https://linktree.diegonmarcos.com/)
//
// Title cards (.link-section--title-card) are decorative and do not count.

export async function checkSections(page, { settleMs = 4000 } = {}) {
  await page.waitForSelector('.section-box', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('.section-box .swiper-initialized').length >= document.querySelectorAll('.section-box').length, null, { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(settleMs);
  const report = await page.evaluate(async () => {
    const out = [];
    for (const box of document.querySelectorAll('.section-box')) {
      const name = (box.className.match(/(\S+)-section|(\S+)-profiles/) || [box.className])[0];
      box.scrollIntoView();
      await new Promise(r => setTimeout(r, 500)); // swiper only advances once the box is in view
      const swiperEl = box.querySelector('.swiper');
      const sw = swiperEl && swiperEl.swiper;
      const slides = [...box.querySelectorAll('.swiper-slide')];
      const total = sw ? sw.slides.length : slides.length;
      let good = 0;
      const n = sw ? total : 1;
      for (let i = 0; i < n; i++) {
        if (sw) { sw.slideTo(i, 0); await new Promise(r => setTimeout(r, 450)); }
        const active = box.querySelector('.swiper-slide-active') || box;
        const card = active.querySelector('.link-section:not(.link-section--title-card)') ||
                     (active.matches('.link-section:not(.link-section--title-card)') ? active : null);
        if (!card) continue;
        const r = card.getBoundingClientRect();
        const cs = getComputedStyle(active);
        const visible = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.5;
        const hasContent = (card.innerText || '').trim().length > 0 && card.querySelector('a, img, svg, button');
        if (visible && hasContent) good++;
      }
      out.push({ name, slides: total, goodCards: good });
    }
    return out;
  });
  const bad = report.filter(s => s.goodCards < 1);
  return { report, ok: report.length > 0 && bad.length === 0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { createRequire } = await import('node:module');
  const { chromium } = createRequire(import.meta.url)('playwright');
  const url = process.argv[2] || 'https://linktree.diegonmarcos.com/';
  const browser = await chromium.launch();
  let failed = false;
  for (const viewport of [{ width: 412, height: 915 }, { width: 1280, height: 800 }]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const { report, ok } = await checkSections(page);
    console.log(`${viewport.width}x${viewport.height}`, JSON.stringify(report));
    if (!ok) { console.error('FAIL: a section has no visible card with content'); failed = true; }
    await ctx.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
}
