import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { appReducer, initialState } from './reducer.js';
import type { AppState, AppAction } from './types.js';

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
  initialPath?: string;
  isSolution?: boolean;
}

export function AppProvider({ children, initialPath, isSolution }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    solutionPath: isSolution ? initialPath ?? null : null,
    projectPath: !isSolution ? initialPath ?? null : null,
    currentScreen: isSolution ? 'batch-operation-type' : 'main',
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

export function useAppState() {
  return useAppContext().state;
}

export function useAppDispatch() {
  return useAppContext().dispatch;
}
