// ==========================================================================
// UI - DOM overlays (zone label, HUD, d-pad, shelter)
// ==========================================================================

let worldTitleEl: HTMLElement;
let worldTitleText: HTMLElement;
let zoneLabelEl: HTMLElement;
let zoneLabelText: HTMLElement;
let dpadEl: HTMLElement;
let loadingEl: HTMLElement;
let labelTimer: ReturnType<typeof setTimeout> | null = null;

export function initUI(): void {
  worldTitleEl = document.getElementById('world-title')!;
  worldTitleText = document.getElementById('world-title-text')!;
  zoneLabelEl = document.getElementById('zone-label')!;
  zoneLabelText = document.getElementById('zone-label-text')!;
  dpadEl = document.getElementById('dpad')!;
  loadingEl = document.getElementById('loading')!;
}

/** Show zone label briefly (2s). */
export function showZoneLabel(name: string): void {
  if (labelTimer) clearTimeout(labelTimer);

  zoneLabelText.textContent = name;
  zoneLabelEl.removeAttribute('hidden');

  // Trigger reflow then add class
  void zoneLabelEl.offsetWidth;
  zoneLabelEl.classList.add('visible');

  labelTimer = setTimeout(() => {
    zoneLabelEl.classList.remove('visible');
    setTimeout(() => {
      zoneLabelEl.setAttribute('hidden', '');
    }, 300);
  }, 2000);
}

/** Show d-pad controls (mobile). */
export function showDpad(): void {
  dpadEl.removeAttribute('hidden');
}

/** Hide d-pad. */
export function hideDpad(): void {
  dpadEl.setAttribute('hidden', '');
}

/** Hide loading screen. */
export function hideLoading(): void {
  loadingEl.classList.add('fade-out');
  setTimeout(() => {
    loadingEl.setAttribute('hidden', '');
  }, 500);
}

/** Show loading screen. */
export function showLoading(): void {
  loadingEl.classList.remove('fade-out');
  loadingEl.removeAttribute('hidden');
}

/** Update 2.5D toggle button active state. */
export function update25DButton(isActive: boolean): void {
  document.getElementById('btn-25d')!.classList.toggle('active', isActive);
}

// ── World Title ────────────────────────────────────────────

/** Update the persistent world title bar based on current zone. */
export function updateWorldTitle(zoneName: string, theme: 'winter' | 'summer' | 'neutral'): void {
  worldTitleText.textContent = zoneName;
  worldTitleEl.classList.remove('winter', 'summer');
  if (theme !== 'neutral') {
    worldTitleEl.classList.add(theme);
  }
}
