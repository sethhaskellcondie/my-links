/** Tiny helper: make an element with a class and optional children/props. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.assign(node, props);
  return node;
}
