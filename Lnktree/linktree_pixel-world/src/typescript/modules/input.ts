// ==========================================================================
// Input - Keyboard + touch (d-pad) + click-to-move
// ==========================================================================

export type InputCallback = (action: InputAction) => void;

export const enum InputAction {
  MoveUp = 'up',
  MoveDown = 'down',
  MoveLeft = 'left',
  MoveRight = 'right',
  Interact = 'interact',
  Back = 'back',
  Toggle25D = 'toggle25d',
}

const heldKeys = new Set<string>();
let callback: InputCallback | null = null;
let repeatInterval: ReturnType<typeof setInterval> | null = null;
const REPEAT_DELAY = 160;

export function initInput(cb: InputCallback): void {
  callback = cb;

  // Keyboard
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // D-pad touch buttons
  const dpadBtns = document.querySelectorAll<HTMLButtonElement>('.dpad-btn');
  dpadBtns.forEach(btn => {
    const dir = btn.dataset.dir;
    if (!dir) return;

    const action = dirToAction(dir);
    if (!action) return;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cb(action);
      // Hold-to-repeat for movement
      if (action !== InputAction.Interact && action !== InputAction.Back) {
        repeatInterval = setInterval(() => cb(action), REPEAT_DELAY);
      }
    });

    btn.addEventListener('pointerup', stopRepeat);
    btn.addEventListener('pointerleave', stopRepeat);
    btn.addEventListener('pointercancel', stopRepeat);
  });
}

function dirToAction(dir: string): InputAction | null {
  switch (dir) {
    case 'up': return InputAction.MoveUp;
    case 'down': return InputAction.MoveDown;
    case 'left': return InputAction.MoveLeft;
    case 'right': return InputAction.MoveRight;
    case 'action': return InputAction.Interact;
    default: return null;
  }
}

function stopRepeat(): void {
  if (repeatInterval) {
    clearInterval(repeatInterval);
    repeatInterval = null;
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (!callback) return;
  if (e.repeat && heldKeys.has(e.code)) return; // browser key repeat handled below

  heldKeys.add(e.code);

  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      e.preventDefault();
      callback(InputAction.MoveUp);
      startKeyRepeat(InputAction.MoveUp, e.code);
      break;
    case 'ArrowDown':
    case 'KeyS':
      e.preventDefault();
      callback(InputAction.MoveDown);
      startKeyRepeat(InputAction.MoveDown, e.code);
      break;
    case 'ArrowLeft':
    case 'KeyA':
      e.preventDefault();
      callback(InputAction.MoveLeft);
      startKeyRepeat(InputAction.MoveLeft, e.code);
      break;
    case 'ArrowRight':
    case 'KeyD':
      e.preventDefault();
      callback(InputAction.MoveRight);
      startKeyRepeat(InputAction.MoveRight, e.code);
      break;
    case 'Enter':
    case 'Space':
      e.preventDefault();
      callback(InputAction.Interact);
      break;
    case 'Escape':
    case 'Backspace':
      e.preventDefault();
      callback(InputAction.Back);
      break;
    case 'KeyV':
      e.preventDefault();
      callback(InputAction.Toggle25D);
      break;
  }
}

function onKeyUp(e: KeyboardEvent): void {
  heldKeys.delete(e.code);
  stopRepeat();
}

const keyRepeatTimers = new Map<string, ReturnType<typeof setInterval>>();

function startKeyRepeat(action: InputAction, code: string): void {
  stopRepeat();
  // Clear any existing repeat for this key
  const existing = keyRepeatTimers.get(code);
  if (existing) clearInterval(existing);

  repeatInterval = setInterval(() => {
    if (!heldKeys.has(code) || !callback) {
      stopRepeat();
      return;
    }
    callback(action);
  }, REPEAT_DELAY);
  keyRepeatTimers.set(code, repeatInterval);
}

export function destroyInput(): void {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  stopRepeat();
  keyRepeatTimers.forEach(t => clearInterval(t));
  keyRepeatTimers.clear();
  heldKeys.clear();
  callback = null;
}

/** Check if touch device (for showing d-pad). */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
