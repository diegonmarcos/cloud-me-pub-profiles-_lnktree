// The ONE card component (#1293 follow-up), used by every carousel section: portal-render.ts (Professional Profiles,
// Personal Profiles, xProjects) and areas.ts (Areas). A card is
//   <div class="swiper-slide"><div class="link-section">
//     <h2 class="section-title">…</h2> [<img class="featured-image"> | media] <div class="links-container">…</div>
//   </div></div>
// and its look lives in the shared link-section / featured-image / links-container styles; no section-specific cards.
import { el } from '../utils/dom';

export interface CardImage { src: string; alt?: string; eager?: boolean; }
export interface CardOptions {
  title: string | Node;
  titleClass?: string;          // default 'section-title'
  sectionClass?: string;        // extra classes on .link-section
  image?: CardImage;            // featured image (banner) under the title
  media?: HTMLElement;          // or any media block in that slot (e.g. a .card-swiper)
  body?: boolean;               // default true: append a .links-container and return it
  data?: Record<string, string>; // data-* attributes on .link-section
}
export interface Card { slide: HTMLElement; section: HTMLElement; body: HTMLElement | null; }

// Featured images sit below the fold, so lazy + low priority unless `eager` (the above-the-fold hero).
export function featuredImg(src: string, alt: string, eager = false): HTMLImageElement {
  const attrs: Record<string, string> = { src, alt, class: 'featured-image', decoding: 'async' };
  if (eager) attrs['fetchpriority'] = 'high';
  else { attrs['loading'] = 'lazy'; attrs['fetchpriority'] = 'low'; }
  return el('img', attrs);
}

export function slideCard(o: CardOptions): Card {
  const section = el('div', { class: `link-section${o.sectionClass ? ' ' + o.sectionClass : ''}` });
  for (const [k, v] of Object.entries(o.data ?? {})) section.dataset[k] = v;
  section.appendChild(el('h2', { class: o.titleClass ?? 'section-title' }, [o.title]));
  if (o.image) section.appendChild(featuredImg(o.image.src, o.image.alt ?? (typeof o.title === 'string' ? o.title : ''), o.image.eager));
  if (o.media) section.appendChild(o.media);
  const body = o.body === false ? null : section.appendChild(el('div', { class: 'links-container' }));
  return { slide: el('div', { class: 'swiper-slide' }, [section]), section, body };
}
