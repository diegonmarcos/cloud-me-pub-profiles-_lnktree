// ASCII art animation for loading screen
// Cycles through frames of a spinning cube / matrix effect

const FRAMES = [
  `
  ┌──────────────┐
  │  ╔══╗  ┌──┐  │
  │  ║▓▓║  │░░│  │
  │  ╚══╝  └──┘  │
  │   ◄ loading ► │
  └──────────────┘`,
  `
  ┌──────────────┐
  │  ╔══╗  ┌──┐  │
  │  ║░░║  │▓▓│  │
  │  ╚══╝  └──┘  │
  │   ◄ loading ► │
  └──────────────┘`,
  `
  ╔════════════════╗
  ║ ▒▒▒▓▓▓█████▓▓▒ ║
  ║  { compiling }  ║
  ║ ▒▓▓█████▓▓▒▒▒  ║
  ╚════════════════╝`,
  `
  ╔════════════════╗
  ║ ▓▓█████▓▓▒▒▒▒ ║
  ║  { compiling }  ║
  ║ ▒▒▒▓▓▓█████▓▓  ║
  ╚════════════════╝`,
  `
     ╱╲    ╱╲
    ╱  ╲  ╱  ╲
   ╱ ▓▓ ╲╱ ░░ ╲
   ╲ ░░ ╱╲ ▓▓ ╱
    ╲  ╱  ╲  ╱
     ╲╱    ╲╱`,
  `
     ╱╲    ╱╲
    ╱  ╲  ╱  ╲
   ╱ ░░ ╲╱ ▓▓ ╲
   ╲ ▓▓ ╱╲ ░░ ╱
    ╲  ╱  ╲  ╱
     ╲╱    ╲╱`,
  `
  ┌─┐ ┌─┐ ┌─┐ ┌─┐
  │<│ │/│ │>│ │_│
  └─┘ └─┘ └─┘ └─┘
   ▓▓▒▒░░  ░░▒▒▓▓
  ══════════════════`,
  `
  ┌─┐ ┌─┐ ┌─┐ ┌─┐
  │_│ │<│ │/│ │>│
  └─┘ └─┘ └─┘ └─┘
   ░░▒▒▓▓  ▓▓▒▒░░
  ══════════════════`,
  `
    ┌──┤ SYS ├──┐
    │ ░░░░░░░░░ │
    │ ▓▓▓▓▓▓░░░ │
    │ ████▓▓░░░ │
    └───────────┘
      [ 73% OK ]`,
  `
    ┌──┤ SYS ├──┐
    │ ░░░░░░░░░ │
    │ ▓▓▓▓▓▓▓▓░ │
    │ █████▓▓▓░ │
    └───────────┘
      [ 91% OK ]`,
];

let el: HTMLElement | null = null;
let frameIdx = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startAsciiAnim(): void {
  el = document.getElementById('ascii-art');
  if (!el) return;

  el.textContent = FRAMES[0].trimStart();
  frameIdx = 0;

  intervalId = setInterval(() => {
    frameIdx = (frameIdx + 1) % FRAMES.length;
    if (el) el.textContent = FRAMES[frameIdx].trimStart();
  }, 400);
}

export function stopAsciiAnim(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
