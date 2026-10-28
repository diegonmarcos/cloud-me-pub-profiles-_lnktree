// Service-Worker auto-reload — fires `reload()` ONCE when a new SW takes
// over a page that was previously controlled by a different SW (i.e. a
// post-deploy update). Critically, it does NOT fire on the first-ever
// activation: a page with no prior controller is already serving fresh
// network bytes, so reloading it is wasted work that users perceive as
// "the page refreshes itself right after I open it".
//
// The fix gates the reload on `controller !== null` AT REGISTRATION TIME.
// On first-ever visit the page loads from network with no controller, the
// SW activates + claims, controllerchange fires — but `hadController` is
// false, so we skip. On a subsequent visit (or post-deploy), an OLD SW
// controlled the page → `hadController` is true → reload happens once.

export interface SwAutoReloadDeps {
  serviceWorker: Pick<ServiceWorkerContainer, 'addEventListener' | 'controller'>;
  reload: () => void;
}

export function setupSwAutoReload(deps: SwAutoReloadDeps): void {
  const hadController = deps.serviceWorker.controller !== null;
  let reloading = false;
  deps.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (reloading) return;
    reloading = true;
    deps.reload();
  });
}
