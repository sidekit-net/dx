import type { AppState, AppAction } from './types.js';

export const initialState: AppState = {
  solutionPath: null,
  projectPath: null,
  projects: [],
  selectedProjects: [],
  currentScreen: 'main',
  activeTab: 'search',
  searchQuery: '',
  searchResults: [],
  installedPackages: [],
  projectReferences: [],
  selectedIndex: 0,
  selectedPackage: null,
  isLoading: false,
  error: null,
  showPrerelease: true,
  operationInProgress: false,
  operationMessage: null,
  batchOperation: {
    type: null,
    package: null,
    sourceProjects: [],
    targetProjects: [],
    inProgress: false,
    results: [],
  },
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SOLUTION':
      return {
        ...state,
        solutionPath: action.path,
        projects: action.projects,
      };

    case 'SET_PROJECT':
      return {
        ...state,
        projectPath: action.path,
        currentScreen: 'main',
      };

    case 'TOGGLE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p, i) =>
          i === action.index ? { ...p, selected: !p.selected } : p
        ),
      };

    case 'CONFIRM_PROJECT_SELECTION':
      const selected = state.projects.filter((p) => p.selected);
      const cursorProject = state.projects[state.selectedIndex];
      const activeProject = cursorProject?.selected
        ? cursorProject
        : selected[0];
      return {
        ...state,
        selectedProjects: selected,
        projectPath: activeProject?.path ?? null,
        currentScreen: 'main',
        selectedIndex: 0,
      };

    case 'SET_SCREEN':
      return { ...state, currentScreen: action.screen, selectedIndex: 0 };

    case 'SET_TAB':
      return { ...state, activeTab: action.tab, selectedIndex: 0 };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };

    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.results, selectedIndex: 0 };

    case 'SET_INSTALLED_PACKAGES':
      return { ...state, installedPackages: action.packages };

    case 'SET_PROJECT_REFERENCES':
      return { ...state, projectReferences: action.references };

    case 'SET_SELECTED_INDEX':
      return { ...state, selectedIndex: action.index };

    case 'SET_SELECTED_PACKAGE':
      return {
        ...state,
        selectedPackage: action.pkg,
        currentScreen: action.pkg ? 'package-detail' : state.currentScreen,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'TOGGLE_PRERELEASE':
      return { ...state, showPrerelease: !state.showPrerelease };

    case 'SET_OPERATION':
      return {
        ...state,
        operationInProgress: action.inProgress,
        operationMessage: action.message ?? null,
      };

    case 'NAVIGATE_UP':
      return {
        ...state,
        selectedIndex: Math.max(0, state.selectedIndex - 1),
      };

    case 'NAVIGATE_DOWN':
      return {
        ...state,
        selectedIndex: Math.min(action.maxIndex, state.selectedIndex + 1),
      };

    case 'SET_BATCH_OPERATION_TYPE':
      return {
        ...state,
        batchOperation: {
          ...initialState.batchOperation,
          type: action.operationType,
        },
      };

    case 'SET_BATCH_PACKAGE':
      return {
        ...state,
        batchOperation: {
          ...state.batchOperation,
          package: { id: action.packageId, version: action.version },
        },
      };

    case 'TOGGLE_BATCH_SOURCE_PROJECT':
      const sourceProjects = state.batchOperation.sourceProjects.includes(action.projectPath)
        ? state.batchOperation.sourceProjects.filter((p) => p !== action.projectPath)
        : [...state.batchOperation.sourceProjects, action.projectPath];
      return {
        ...state,
        batchOperation: {
          ...state.batchOperation,
          sourceProjects,
        },
      };

    case 'TOGGLE_BATCH_TARGET_PROJECT':
      const targetProjects = state.batchOperation.targetProjects.includes(action.projectPath)
        ? state.batchOperation.targetProjects.filter((p) => p !== action.projectPath)
        : [...state.batchOperation.targetProjects, action.projectPath];
      return {
        ...state,
        batchOperation: {
          ...state.batchOperation,
          targetProjects,
        },
      };

    case 'SET_BATCH_RESULTS':
      return {
        ...state,
        batchOperation: {
          ...state.batchOperation,
          inProgress: false,
          results: action.results,
        },
      };

    case 'RESET_BATCH_OPERATION':
      return {
        ...state,
        batchOperation: initialState.batchOperation,
      };

    default:
      return state;
  }
}
