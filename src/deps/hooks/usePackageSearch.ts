import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { searchPackages } from '../api/nuget-client.js';

const DEBOUNCE_MS = 300;

export function usePackageSearch() {
  const { searchQuery, showPrerelease } = useAppState();
  const dispatch = useAppDispatch();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search for empty queries
    if (!searchQuery.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', results: [] });
      dispatch({ type: 'SET_LOADING', loading: false });
      return;
    }

    // Set loading state immediately for UX
    dispatch({ type: 'SET_LOADING', loading: true });

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        const results = await searchPackages(searchQuery, {
          prerelease: showPrerelease,
        });
        dispatch({ type: 'SET_SEARCH_RESULTS', results });
        dispatch({ type: 'SET_ERROR', error: null });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          dispatch({
            type: 'SET_ERROR',
            error: error.message || 'Search failed',
          });
          dispatch({ type: 'SET_SEARCH_RESULTS', results: [] });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, showPrerelease]);

  return {
    query: searchQuery,
    setQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', query }),
  };
}
