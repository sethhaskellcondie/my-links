/**
 * The smallest observable value this app needs: read it, set it, react to it.
 * `set` always notifies — even when the value is unchanged — so pressing VOL +
 * at maximum still counts as "the viewer touched the volume".
 */
export function createState<T>(initial: T) {
  let current = initial;
  const listeners = new Set<(value: T) => void>();

  return {
    get: (): T => current,

    set: (next: T): void => {
      current = next;
      for (const listener of listeners) listener(next);
    },

    /** Fires immediately with the current value, then on every `set`. */
    subscribe: (listener: (value: T) => void): void => {
      listeners.add(listener);
      listener(current);
    },
  };
}
