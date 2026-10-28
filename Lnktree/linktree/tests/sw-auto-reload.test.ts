import { describe, it, expect, vi } from 'vitest';
import { setupSwAutoReload } from '../src/typescript/utils/sw-auto-reload';

interface FakeSwContainer {
  addEventListener: (ev: string, cb: () => void) => void;
  controller: object | null;
  fire: () => void;
}

function fakeSwContainer(controller: object | null): FakeSwContainer {
  let listener: (() => void) | null = null;
  return {
    controller,
    addEventListener: (ev, cb) => { if (ev === 'controllerchange') listener = cb; },
    fire: () => listener?.(),
  };
}

describe('setupSwAutoReload — fix for "page silently refreshes itself on first load"', () => {
  it('does NOT reload on first-ever activation (controller was null at registration)', () => {
    const sw = fakeSwContainer(null);
    const reload = vi.fn();
    setupSwAutoReload({ serviceWorker: sw, reload });
    sw.fire();
    expect(reload).not.toHaveBeenCalled();
  });

  it('DOES reload exactly once when an existing SW controller is replaced (post-deploy update)', () => {
    const sw = fakeSwContainer({} /* an existing SW was already controlling the page */);
    const reload = vi.fn();
    setupSwAutoReload({ serviceWorker: sw, reload });
    sw.fire();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('dedupes multiple controllerchange events into a single reload', () => {
    const sw = fakeSwContainer({});
    const reload = vi.fn();
    setupSwAutoReload({ serviceWorker: sw, reload });
    sw.fire();
    sw.fire();
    sw.fire();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('captures the controller state at registration time, not at fire time', () => {
    // Simulates: page loads with no controller → setupSwAutoReload runs →
    // SW activates and claims the page → controller becomes non-null →
    // controllerchange fires. We must STILL skip the reload because the
    // page itself was loaded fresh from network, with no stale SW cache.
    const sw = fakeSwContainer(null);
    const reload = vi.fn();
    setupSwAutoReload({ serviceWorker: sw, reload });
    (sw as unknown as { controller: object | null }).controller = {}; // SW now in control
    sw.fire();
    expect(reload).not.toHaveBeenCalled();
  });
});
