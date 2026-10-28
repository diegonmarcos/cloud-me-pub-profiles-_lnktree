import { buildTree } from './modules/data-from-linktree';
import { initIconView } from './modules/iconview';

document.addEventListener('DOMContentLoaded', () => {
  initIconView(buildTree());
});
