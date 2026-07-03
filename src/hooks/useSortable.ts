"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
export type Accessor<T> = (item: T) => string | number;

/**
 * Generic client-side table sorting.
 * Pass the rows and a map of column key → accessor. Call requestSort(key) from
 * a header; clicking the active column flips direction.
 */
export function useSortable<T>(
  items: T[],
  accessors: Record<string, Accessor<T>>,
  initialKey?: string,
  initialDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const requestSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !accessors[sortKey]) return items;
    const accessor = accessors[sortKey];
    const dir = sortDir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [items, sortKey, sortDir, accessors]);

  return { sorted, sortKey, sortDir, requestSort };
}
