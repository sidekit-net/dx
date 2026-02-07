import { useCallback } from 'react';
import { useAppState, useAppDispatch } from '../store/app-context.js';

export function useNavigation(maxIndex: number) {
  const { selectedIndex } = useAppState();
  const dispatch = useAppDispatch();

  const navigateUp = useCallback(() => {
    dispatch({ type: 'NAVIGATE_UP' });
  }, [dispatch]);

  const navigateDown = useCallback(() => {
    dispatch({ type: 'NAVIGATE_DOWN', maxIndex });
  }, [dispatch, maxIndex]);

  const setIndex = useCallback(
    (index: number) => {
      dispatch({ type: 'SET_SELECTED_INDEX', index: Math.max(0, Math.min(maxIndex, index)) });
    },
    [dispatch, maxIndex]
  );

  return {
    selectedIndex,
    navigateUp,
    navigateDown,
    setIndex,
  };
}
