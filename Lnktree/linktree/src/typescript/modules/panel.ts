// One reusable full-screen window, shared by every panel (Dev Tools,
// Commits, About). Callers supply a title and a body renderer; the shell,
// the close button and the dismiss behaviour live here exactly once, so no
// panel can ever ship without a way back to the page.
//
// Reuses the markup already in index.html (`#status-modal`) rather than
// minting a modal per feature — three windows, one set of styles.

export interface PanelSpec {
  title: string;
  // Returning a promise gets a spinner for free while it resolves.
  render: () => string | Promise<string>;
  // Runs after the body HTML lands, for wiring buttons inside the panel.
  onMount?: (body: HTMLElement) => void;
  loadingLabel?: string;
}

interface PanelElements {
  modal: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
  close: HTMLElement;
}

// Bumped on every open. An async render whose token is stale lost the race
// to a panel the user opened afterwards, and must not paint over it.
let openToken = 0;
let wired = false;

function elements(): PanelElements | null {
  const modal = document.getElementById('status-modal');
  const title = document.getElementById('status-modal-title');
  const body = document.getElementById('status-modal-body');
  const close = document.getElementById('status-modal-close');
  if (!modal || !title || !body || !close) return null;
  return { modal, title, body, close };
}

export function closePanel(): void {
  const el = elements();
  if (!el) return;
  el.modal.style.display = 'none';
  // Re-show the FABs — the scroll-hide may have tucked them away while the
  // panel was open, which would leave the page with no visible controls.
  document.querySelector('.controls-fab-container')?.classList.remove('fab-hidden');
  document.getElementById('hamburger-menu')?.classList.remove('fab-hidden');
}

export function isPanelOpen(): boolean {
  const el = elements();
  return !!el && el.modal.style.display === 'flex';
}

function wire(el: PanelElements): void {
  if (wired) return;
  wired = true;
  el.close.addEventListener('click', closePanel);
  el.modal.addEventListener('click', (e) => {
    if (e.target === el.modal) closePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPanelOpen()) closePanel();
  });
}

export function openPanel(spec: PanelSpec): void {
  const el = elements();
  if (!el) return;
  wire(el);

  const token = ++openToken;
  el.title.textContent = spec.title;
  el.modal.style.display = 'flex';

  const mount = (html: string): void => {
    if (token !== openToken) return;
    el.body.innerHTML = html;
    spec.onMount?.(el.body);
  };

  const result = spec.render();
  if (typeof result === 'string') {
    mount(result);
    return;
  }

  el.body.innerHTML = `
    <div class="status-loading">
      <div class="status-spinner"></div>
      <p>${spec.loadingLabel ?? 'Loading…'}</p>
    </div>`;
  result.then(mount).catch((err: unknown) => {
    console.error('panel render failed:', err);
    if (token === openToken) {
      el.body.innerHTML = '<p class="diag-no-data">Could not load this panel.</p>';
    }
  });
}
