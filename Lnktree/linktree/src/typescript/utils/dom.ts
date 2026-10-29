// DOM utility functions

/**
 * Type-safe getElementById
 */
export function getElementById<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Type-safe querySelector
 */
export function querySelector<T extends Element>(selector: string, parent: ParentNode = document): T | null {
  return parent.querySelector(selector) as T | null;
}

/**
 * Type-safe querySelectorAll
 */
export function querySelectorAll<T extends Element>(selector: string, parent: ParentNode = document): NodeListOf<T> {
  return parent.querySelectorAll(selector) as NodeListOf<T>;
}

/**
 * Set CSS custom property on element
 */
export function setCSSProperty(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
}

/**
 * Add class to element
 */
export function addClass(element: HTMLElement, className: string): void {
  element.classList.add(className);
}

/**
 * Remove class from element
 */
export function removeClass(element: HTMLElement, className: string): void {
  element.classList.remove(className);
}

/**
 * Check if element has class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * The one element builder: el('a', { class: 'tool-link', href }, [icon, 'label']). `class` sets className; every
 * other attribute goes through setAttribute; string children become text nodes.
 */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, children: Array<Node | string> = []): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return node;
}
