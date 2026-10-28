// Logcat viewer: captures console output + errors, shows in an overlay.
// Actions: copy to clipboard, export as .log file, post to API.

const LOG_API_ENDPOINT = '/api/logs';
const MAX_ENTRIES = 500;

interface LogEntry { level: string; time: string; msg: string; }

const entries: LogEntry[] = [];

function stamp(): string {
  return new Date().toISOString().slice(11, 23);
}

function capture(level: string, ...args: unknown[]): void {
  if (entries.length >= MAX_ENTRIES) entries.shift();
  entries.push({ level, time: stamp(), msg: args.map(String).join(' ') });
  const list = document.getElementById('logcat-list');
  if (list) appendRow(list, entries[entries.length - 1]);
}

function appendRow(list: HTMLElement, entry: LogEntry): void {
  const row = document.createElement('div');
  row.className = `logcat-row logcat-row--${entry.level}`;
  row.textContent = `[${entry.time}] ${entry.level.toUpperCase()} ${entry.msg}`;
  list.appendChild(row);
  list.scrollTop = list.scrollHeight;
}

function patchConsole(): void {
  (['log', 'warn', 'error', 'info', 'debug'] as const).forEach((level) => {
    const original = console[level].bind(console);
    (console as unknown as Record<string, (...a: unknown[]) => void>)[level] = (...args: unknown[]) => {
      original(...args);
      capture(level, ...args);
    };
  });
  window.addEventListener('error', (e) => capture('error', e.message, e.filename, e.lineno));
  window.addEventListener('unhandledrejection', (e) => capture('error', String(e.reason)));
}

function asText(): string {
  return entries.map((e) => `[${e.time}] ${e.level.toUpperCase()} ${e.msg}`).join('\n');
}

export function initLogcatViewer(): void {
  patchConsole();

  const btn = document.getElementById('logcat-toggle');
  if (!btn) return;

  // Build overlay once
  const overlay = document.createElement('div');
  overlay.id = 'logcat-overlay';
  overlay.className = 'logcat-overlay';
  overlay.innerHTML = `
    <div class="logcat-header">
      <span>Logcat</span>
      <div class="logcat-actions">
        <button id="logcat-copy">Copy</button>
        <button id="logcat-export">Export</button>
        <button id="logcat-post">Post to API</button>
        <button id="logcat-clear">Clear</button>
        <button id="logcat-close">&times;</button>
      </div>
    </div>
    <div class="logcat-list" id="logcat-list"></div>
  `;
  document.body.appendChild(overlay);

  // Populate existing entries
  const list = overlay.querySelector('#logcat-list') as HTMLElement;
  entries.forEach((e) => appendRow(list, e));

  function showFabs(): void {
    document.querySelector('.controls-fab-container')?.classList.remove('fab-hidden');
    document.getElementById('hamburger-menu')?.classList.remove('fab-hidden');
  }

  btn.addEventListener('click', () => { overlay.style.display = 'flex'; });

  overlay.querySelector('#logcat-close')!.addEventListener('click', () => {
    overlay.style.display = 'none';
    showFabs();
  });

  overlay.querySelector('#logcat-copy')!.addEventListener('click', () => {
    navigator.clipboard.writeText(asText()).catch(() => undefined);
  });

  overlay.querySelector('#logcat-export')!.addEventListener('click', () => {
    const blob = new Blob([asText()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `logcat-${stamp().replace(/:/g, '-')}.log`;
    a.click();
  });

  overlay.querySelector('#logcat-post')!.addEventListener('click', () => {
    fetch(LOG_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    }).catch(() => undefined);
  });

  overlay.querySelector('#logcat-clear')!.addEventListener('click', () => {
    entries.length = 0;
    list.innerHTML = '';
  });
}
