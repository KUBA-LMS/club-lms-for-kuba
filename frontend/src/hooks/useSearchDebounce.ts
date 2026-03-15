import { useState, useEffect, useRef } from 'react';

export function useSearchDebounce<T>(
  query: string,
  searchFn: (q: string) => Promise<T[]>,
  delay: number = 300,
): { results: T[]; isLoading: boolean } {
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const currentId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const data = await searchFn(trimmed);
        // Only update if this is still the latest request
        if (currentId === requestIdRef.current) {
          setResults(data);
        }
      } catch (error) {
        if (currentId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (currentId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, searchFn]);

  return { results, isLoading };
}
