"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseSupabaseRealtimeOptions<T> {
  filter?: (item: T) => boolean;
  sort?: (a: T, b: T) => number;
  enabled?: boolean;
  realtime?: boolean;
  eq?: { column: string; value: string };
}

interface UseSupabaseRealtimeReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

export function useSupabaseRealtime<T extends { id: string }>(
  table: string,
  options?: UseSupabaseRealtimeOptions<T>
): UseSupabaseRealtimeReturn<T> {
  const { filter, sort, enabled = true, realtime = true, eq } = options || {};
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterRef = useRef(filter);
  const sortRef = useRef(sort);
  filterRef.current = filter;
  sortRef.current = sort;

  const applyTransforms = useCallback((items: T[]): T[] => {
    let result = items;
    if (filterRef.current) result = result.filter(filterRef.current);
    if (sortRef.current) result = [...result].sort(sortRef.current);
    return result;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    const supabase = createClient();
    setLoading(true);
    setError(null);

    const cacheKey = `${table}:${eq?.column ?? ""}:${eq?.value ?? ""}`;
    const globalStore = globalThis as typeof globalThis & {
      __apfRealtimeCache?: Record<string, unknown[]>;
      __apfRealtimeInflight?: Record<string, Promise<{ data: unknown[] | null; error: { message: string } | null }>>;
    };
    if (!globalStore.__apfRealtimeCache) globalStore.__apfRealtimeCache = {};
    if (!globalStore.__apfRealtimeInflight) globalStore.__apfRealtimeInflight = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from(table).select("*");
    if (eq) {
      query = query.eq(eq.column, eq.value);
    }

    if (globalStore.__apfRealtimeCache[cacheKey]) {
      setData(
        applyTransforms(
          (globalStore.__apfRealtimeCache[cacheKey] ?? []) as T[]
        )
      );
      setLoading(false);
    }

    const inflight =
      globalStore.__apfRealtimeInflight[cacheKey] ??
      query.then(
        ({ data: rows, error: err }: { data: unknown[] | null; error: { message: string } | null }) => ({
          data: rows,
          error: err,
        })
      );
    globalStore.__apfRealtimeInflight[cacheKey] = inflight;

    inflight.then(({ data: rows, error: err }) => {
      if (err) {
        setError(new Error(err.message));
        setLoading(false);
        return;
      }
      const typed = (rows ?? []) as T[];
      globalStore.__apfRealtimeCache![cacheKey] = typed as unknown[];
      setData(applyTransforms(typed));
      setLoading(false);
      delete globalStore.__apfRealtimeInflight![cacheKey];
    });

    if (!realtime) return;

    const channel = supabase
      .channel(`${table}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          setData((prev) => {
            const current = prev ?? [];
            let updated: T[];

            if (payload.eventType === "INSERT") {
              const newRow = payload.new as T;
              if (eq && (newRow as Record<string, unknown>)[eq.column] !== eq.value) {
                return current;
              }
              updated = [...current, newRow];
            } else if (payload.eventType === "UPDATE") {
              const updatedRow = payload.new as T;
              updated = current.map((item) =>
                item.id === updatedRow.id ? updatedRow : item
              );
            } else if (payload.eventType === "DELETE") {
              const deletedRow = payload.old as Partial<T>;
              updated = current.filter((item) => item.id !== deletedRow.id);
            } else {
              return current;
            }

            return applyTransforms(updated);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, enabled, eq?.column, eq?.value, applyTransforms, realtime]);

  return { data, loading, error };
}

export function useSupabaseRealtimeSingle<T extends { id: string }>(
  table: string,
  id: string,
  options?: { enabled?: boolean }
): { data: T | null; loading: boolean; error: Error | null } {
  const { enabled = true } = options || {};
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !id) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from(table)
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data: row, error: err }: { data: unknown; error: { message: string } | null }) => {
        if (err) {
          setError(new Error(err.message));
        } else {
          setData(row as T);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`${table}-${id}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `id=eq.${id}` },
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.eventType === "UPDATE") {
            setData(payload.new as T);
          } else if (payload.eventType === "DELETE") {
            setData(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, id, enabled]);

  return { data, loading, error };
}
