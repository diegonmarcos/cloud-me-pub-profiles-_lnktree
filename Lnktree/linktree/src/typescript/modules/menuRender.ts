// Renders the FAB control list and the hamburger nav from the same
// MENU_GROUPS data, so the two menus can never drift out of sync.
//
// Nested items (MenuItem.children) render differently per menu: the
// hamburger gets a real collapsible child menu, while the FAB — an
// icon-only vertical rail with no room to nest — lays the children out
// inline under the group label. Both still resolve to the same button ids,
// because a hamburger item only proxies a click to the FAB button that
// carries the actual behaviour.

import { MENU_GROUPS, type MenuItem } from './menuData';

function renderFabButton(item: MenuItem): HTMLElement {
  const el = document.createElement(item.href ? 'a' : 'button');
  el.id = item.id;
  el.className = 'icon-btn';
  el.setAttribute('data-fab', 'icon-btn');
  el.title = item.label;
  if (item.href) {
    el.setAttribute('href', item.href);
    el.setAttribute('target', '_blank');
  } else {
    el.setAttribute('type', 'button');
  }
  const img = document.createElement('img');
  img.src = `public/icons/${item.icon}`;
  img.alt = item.label;
  img.setAttribute('data-fab-img', '');
  el.appendChild(img);
  return el;
}

function renderHamburgerItem(item: MenuItem): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'hamburger-item';
  btn.dataset['trigger'] = item.id;
  btn.textContent = item.label;
  return btn;
}

// A parent + its collapsible child list. The parent carries no
// `data-trigger`, so main.ts's delegated handler ignores it and the menu
// stays open while the submenu expands.
function renderHamburgerSubmenu(item: MenuItem): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'hamburger-submenu';

  const parent = document.createElement('button');
  parent.className = 'hamburger-item hamburger-item--parent';
  parent.setAttribute('type', 'button');
  parent.setAttribute('aria-expanded', 'false');
  parent.innerHTML = `<span class="hamburger-item__chevron" aria-hidden="true">▸</span>`;
  parent.append(item.label);

  const children = document.createElement('div');
  children.className = 'hamburger-submenu__children';
  for (const child of item.children ?? []) {
    const childBtn = renderHamburgerItem(child);
    childBtn.classList.add('hamburger-item--child');
    children.appendChild(childBtn);
  }

  parent.addEventListener('click', () => {
    const open = parent.getAttribute('aria-expanded') === 'true';
    parent.setAttribute('aria-expanded', String(!open));
    wrapper.classList.toggle('is-open', !open);
  });

  wrapper.append(parent, children);
  return wrapper;
}

export function renderMenu(): void {
  const controlsList = document.getElementById('controls-list');
  const hamburgerNav = document.getElementById('hamburger-nav');
  if (!controlsList || !hamburgerNav) return;

  controlsList.innerHTML = '';
  hamburgerNav.innerHTML = '';

  for (const group of MENU_GROUPS) {
    const fabGroup = document.createElement('div');
    fabGroup.className = 'fab-group';
    const fabLabel = document.createElement('span');
    fabLabel.className = 'fab-group__label';
    fabLabel.textContent = group.label;
    fabGroup.appendChild(fabLabel);

    const hbGroup = document.createElement('div');
    hbGroup.className = 'hamburger-group';
    const hbLabel = document.createElement('span');
    hbLabel.className = 'hamburger-group__label';
    hbLabel.textContent = group.label;
    hbGroup.appendChild(hbLabel);

    for (const item of group.items) {
      if (item.children?.length) {
        for (const child of item.children) fabGroup.appendChild(renderFabButton(child));
        hbGroup.appendChild(renderHamburgerSubmenu(item));
      } else {
        fabGroup.appendChild(renderFabButton(item));
        hbGroup.appendChild(renderHamburgerItem(item));
      }
    }

    controlsList.appendChild(fabGroup);
    hamburgerNav.appendChild(hbGroup);
  }
}
