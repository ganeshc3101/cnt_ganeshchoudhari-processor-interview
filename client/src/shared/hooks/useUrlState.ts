import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { z, ZodTypeAny } from 'zod';

/**
 * Read/write URL search params as a Zod-validated object.
 *
 * Values that match the schema's default or are empty strings / undefined are
 * stripped from the URL so shared links stay clean.
 */
export function useUrlState<TSchema extends ZodTypeAny>(
  schema: TSchema,
): [z.infer<TSchema>, (next: Partial<z.infer<TSchema>>) => void] {
  const [params, setParams] = useSearchParams();

  const value = useMemo<z.infer<TSchema>>(
    () => schema.parse(Object.fromEntries(params.entries())),
    [params, schema],
  );

  const set = useCallback(
    (next: Partial<z.infer<TSchema>>) => {
      setParams((prev) => {
        const merged: Record<string, unknown> = {
          ...Object.fromEntries(prev.entries()),
          ...next,
        };
        const output = new URLSearchParams();
        for (const [key, raw] of Object.entries(merged)) {
          if (raw === undefined || raw === null || raw === '') continue;
          if (Array.isArray(raw)) {
            if (raw.length === 0) continue;
            output.set(key, raw.join(','));
            continue;
          }
          output.set(key, String(raw));
        }
        return output;
      });
    },
    [setParams],
  );

  return [value, set];
}
