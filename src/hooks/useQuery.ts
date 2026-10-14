import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

/** Loads data when the dependencies change; `reload` fetches again after a change. */
export function useQuery<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const counter = useRef(0);

  const run = useCallback(() => {
    const ticket = ++counter.current;
    setLoading(true);
    load()
      .then((result) => {
        if (ticket === counter.current) {
          setData(result);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (ticket === counter.current) setError(e instanceof ApiError ? e : new ApiError(0, 'ERROR', 'Ocurrió un error inesperado.'));
      })
      .finally(() => {
        if (ticket === counter.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  return { data, error, loading, reload: run };
}
