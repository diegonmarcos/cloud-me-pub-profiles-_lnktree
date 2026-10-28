// VM Control module for OCI on-demand VPS management

import { getElementById, addClass, removeClass } from '../utils/dom';

const API_BASE = 'https://api.diegonmarcos.com';
const VM_LABEL = 'oci-flex';

let isLoading = false;
let apiAvailable = false;
let vmId: string | null = null;

async function discoverVmId(): Promise<string | null> {
  if (vmId) return vmId;
  try {
    console.debug('[vmControl] discovering VM via /rust/health/ids ...');
    const response = await fetch(`${API_BASE}/rust/health/ids`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) { console.debug('[vmControl] discovery HTTP', response.status); return null; }
    const data = await response.json();
    console.debug('[vmControl] discovered VMs:', Object.keys(data.vms || {}));
    for (const [id, vm] of Object.entries(data.vms || {})) {
      if ((vm as any).label === VM_LABEL) {
        vmId = id;
        console.debug('[vmControl] matched VM:', id);
        return id;
      }
    }
    console.debug('[vmControl] no VM with label', VM_LABEL);
  } catch (e) {
    console.debug('[vmControl] discovery failed:', (e as Error).message);
  }
  return null;
}

// Indicator: green=online, red=offline, yellow=command running, blue=error/unknown
function setIndicator(color: 'green' | 'yellow' | 'red' | 'blue'): void {
  const indicator = getElementById<HTMLElement>('vm-status-indicator');
  if (!indicator) return;

  removeClass(indicator, 'status-green');
  removeClass(indicator, 'status-red');
  removeClass(indicator, 'status-yellow');
  removeClass(indicator, 'status-blue');
  addClass(indicator, `status-${color}`);

  const titles: Record<string, string> = {
    green: 'VM Online',
    red: 'VM Offline',
    yellow: 'Command Running...',
    blue: 'Status Unknown'
  };
  indicator.title = titles[color];
}

async function checkVmStatus(): Promise<void> {
  setIndicator('yellow');
  try {
    const id = await discoverVmId();
    if (!id) { setIndicator('blue'); return; }

    const url = `${API_BASE}/rust/health/up/${id}`;
    console.debug('[vmControl] checking health:', url);
    const t0 = performance.now();
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.debug('[vmControl] health response:', response.status, `(${((performance.now() - t0) / 1000).toFixed(1)}s)`);

    if (response.ok) {
      const data = await response.json();
      console.debug('[vmControl] health data:', JSON.stringify(data));
      apiAvailable = true;
      setIndicator(data.health === 'online' ? 'green' : 'red');
    } else {
      apiAvailable = false;
      setIndicator('blue');
    }
  } catch (e) {
    console.debug('[vmControl] health check failed:', (e as Error).message);
    apiAvailable = false;
    setIndicator('blue');
  }
}

async function executeVmAction(action: 'start' | 'stop' | 'reboot'): Promise<boolean> {
  if (!vmId) await discoverVmId();
  if (!vmId) await discoverVmId();
  if (!apiAvailable || !vmId) {
    showToast('API not available', true);
    return false;
  }

  try {
    isLoading = true;
    setIndicator('yellow');

    const rustAction = action === 'reboot' ? 'reset' : action;
    const url = `${API_BASE}/rust/vms/${vmId}/${rustAction}`;
    console.debug('[vmControl] action:', action, '→ POST', url);
    const t0 = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });
    console.debug('[vmControl] action response:', response.status, `(${((performance.now() - t0) / 1000).toFixed(1)}s)`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.debug('[vmControl] action result:', JSON.stringify(data));

    if (data.status) {
      const msgs: Record<string, string> = { start: 'VM starting...', stop: 'VM stopping...', reboot: 'VM rebooting...' };
      showToast(msgs[action] || data.message || 'Done');
      setTimeout(() => checkVmStatus(), 10000);
      setTimeout(() => checkVmStatus(), 30000);
      setTimeout(() => checkVmStatus(), 60000);
      return true;
    } else {
      throw new Error('Action failed');
    }
  } catch (error) {
    console.error(`VM ${action} failed:`, error);
    showToast('Action failed', true);
    return false;
  } finally {
    isLoading = false;
    await checkVmStatus();
  }
}

function showToast(message: string, isError: boolean = false): void {
  const toast = document.createElement('div');
  toast.className = `vm-toast ${isError ? 'vm-toast-error' : 'vm-toast-success'}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => addClass(toast, 'vm-toast-visible'));
  setTimeout(() => {
    removeClass(toast, 'vm-toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function initVmControl(): void {
  const startBtn = getElementById<HTMLButtonElement>('vm-start-btn');
  const stopBtn = getElementById<HTMLButtonElement>('vm-stop-btn');
  const rebootBtn = getElementById<HTMLButtonElement>('vm-reboot-btn');
  const refreshBtn = getElementById<HTMLButtonElement>('vm-refresh-btn');

  if (!startBtn || !stopBtn || !rebootBtn) return;

  startBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!isLoading) await executeVmAction('start');
  });
  stopBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!isLoading) await executeVmAction('stop');
  });
  rebootBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!isLoading) await executeVmAction('reboot');
  });
  if (refreshBtn) refreshBtn.addEventListener('click', (e) => {
    e.preventDefault();
    checkVmStatus();
  });

  checkVmStatus();
  setInterval(checkVmStatus, 30000);
}
