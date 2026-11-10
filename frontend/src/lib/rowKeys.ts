import { useRef } from "react";

/**
 * Stable React keys for the rows of an editable list whose items have no id of their own, so a row keeps its
 * own state (a half-typed search, focus) when another row is removed or moved. Tell it about removals and swaps;
 * rows added at the end get a new key.
 */
export function useRowKeys(length: number) {
  const keys = useRef<number[]>([]);
  const next = useRef(0);
  while (keys.current.length < length) keys.current.push(next.current++);
  keys.current.length = length;
  return {
    keys: keys.current,
    remove: (i: number) => void keys.current.splice(i, 1),
    swap: (i: number, j: number) => {
      const k = keys.current;
      [k[i], k[j]] = [k[j]!, k[i]!];
    },
  };
}
