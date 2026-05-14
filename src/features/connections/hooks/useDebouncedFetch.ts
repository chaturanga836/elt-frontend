import { useState, useCallback, useRef } from 'react';

/**
 * A custom hook to handle debounced API fetching with request cancellation.
 * @param fetchService The API service function (e.g., TaskService.getTaskList)
 * @param delay Time to wait after typing stops (default 500ms)
 */
export function useDebouncedFetch<T, P>(
  fetchService: (params: P) => Promise<T>,
  delay: number = 500
) {
  const [data, setData] = useState<T | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<any>(null);

  // Refs to track the debounce timer and the current abort controller
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performFetch = useCallback(
    async (params: P) => {
      // 1. If there's a pending debounce timer, clear it
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 2. Set the debounce timer
      timeoutRef.current = setTimeout(async () => {
        // 3. If a fetch is currently pending, cancel it
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // 4. Create a new AbortController for the current fetch
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setSearching(true);
        setError(null);

        try {
          // Pass the signal to your axios/api call
          // Note: You'll need to update your service to accept the 'signal'
          const result = await fetchService({ 
            ...params, 
            signal: controller.signal 
          });
          
          setData(result);
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Fetch aborted');
          } else {
            setError(err);
          }
        } finally {
          // Only stop loading if this was the latest controller
          if (abortControllerRef.current === controller) {
            setSearching(false);
          }
        }
      }, delay);
    },
    [fetchService, delay]
  );

  return { data, searching, error, performFetch };
}