// ==========================================================================
// Dialog - RPG-style bottom-screen dialog box for link interaction
// ==========================================================================

import type { WorldObject, LinkData } from '../types';

let dialogEl: HTMLElement;
let dialogTitle: HTMLElement;
let dialogLinks: HTMLElement;
let dialogHint: HTMLElement;

let open = false;
let selectedIndex = 0;
let currentLinks: LinkData[] = [];
let currentObjectId: string | null = null;

export function initDialog(): void {
  dialogEl = document.getElementById('dialog-box')!;
  dialogTitle = document.getElementById('dialog-title')!;
  dialogLinks = document.getElementById('dialog-links')!;
  dialogHint = document.getElementById('dialog-hint')!;
}

/** Show the RPG dialog box with links for a world object. */
export function showDialog(obj: WorldObject): void {
  if (!obj.links || obj.links.length === 0) return;
  if (open && currentObjectId === obj.id) return;

  currentLinks = obj.links;
  currentObjectId = obj.id;
  selectedIndex = 0;

  dialogTitle.textContent = obj.label;
  renderLinks();

  dialogHint.textContent = 'UP/DOWN: Select | ENTER: Open | ESC: Close';

  dialogEl.removeAttribute('hidden');
  void dialogEl.offsetWidth;
  dialogEl.classList.add('visible');
  open = true;
}

/** Hide the dialog box. */
export function hideDialog(): void {
  dialogEl.classList.remove('visible');
  open = false;
  setTimeout(() => {
    if (!open) {
      dialogEl.setAttribute('hidden', '');
    }
  }, 300);
}

/** Check if the dialog is currently open. */
export function isDialogOpen(): boolean {
  return open;
}

/** Get the current object ID (for dismissal tracking). */
export function getDismissedId(): string | null {
  return currentObjectId;
}

/** Move selection up. */
export function dialogUp(): void {
  if (!open || currentLinks.length === 0) return;
  selectedIndex = (selectedIndex - 1 + currentLinks.length) % currentLinks.length;
  renderLinks();
}

/** Move selection down. */
export function dialogDown(): void {
  if (!open || currentLinks.length === 0) return;
  selectedIndex = (selectedIndex + 1) % currentLinks.length;
  renderLinks();
}

/** Open the currently selected link. */
export function dialogConfirm(): void {
  if (!open || currentLinks.length === 0) return;
  const link = currentLinks[selectedIndex];
  if (link.download) {
    const a = document.createElement('a');
    a.href = link.url;
    a.download = '';
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  } else {
    window.open(link.url, '_blank', 'noopener');
  }
}

/** Render the link list with selection arrow. */
function renderLinks(): void {
  dialogLinks.innerHTML = '';
  for (let i = 0; i < currentLinks.length; i++) {
    const li = document.createElement('li');
    li.className = 'dialog-link-item';
    if (i === selectedIndex) {
      li.classList.add('selected');
    }

    const arrow = document.createElement('span');
    arrow.className = 'dialog-arrow';
    arrow.textContent = i === selectedIndex ? '>' : ' ';

    const label = document.createElement('span');
    label.className = 'dialog-link-label';
    label.textContent = currentLinks[i].label;

    li.appendChild(arrow);
    li.appendChild(label);
    dialogLinks.appendChild(li);
  }
}
