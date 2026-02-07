export interface NuGetPackage {
  id: string;
  version: string;
  description: string;
  authors: string[];
  totalDownloads: number;
  verified: boolean;
  versions: PackageVersion[];
}

export interface PackageVersion {
  version: string;
  downloads: number;
  isPrerelease: boolean;
}

export interface InstalledPackage {
  id: string;
  version: string;
  latestVersion?: string;
  hasUpdate: boolean;
}

export interface ProjectReference {
  name: string;        // e.g. "MyLib"
  path: string;        // raw Include value (relative)
  absolutePath: string; // resolved for CLI operations
}

export interface Project {
  name: string;
  path: string;
  selected: boolean;
}

export interface Solution {
  path: string;
  projects: Project[];
}

export type Screen =
  | 'project-selection'
  | 'main'
  | 'package-detail'
  | 'batch-operation-type'
  | 'batch-package-search'
  | 'batch-source-picker'
  | 'batch-target-picker'
  | 'batch-results';
export type Tab = 'search' | 'installed' | 'references';

export interface BatchOperation {
  type: 'nuget' | 'project-reference' | null;
  package: { id: string; version: string } | null;
  sourceProjects: string[]; // Paths of projects to reference
  targetProjects: string[]; // Paths of projects to apply operation to
  inProgress: boolean;
  results: { project: string; success: boolean; message: string }[];
}

export interface AppState {
  solutionPath: string | null;
  projectPath: string | null;
  projects: Project[];
  selectedProjects: Project[];
  currentScreen: Screen;
  activeTab: Tab;
  searchQuery: string;
  searchResults: NuGetPackage[];
  installedPackages: InstalledPackage[];
  projectReferences: ProjectReference[];
  selectedIndex: number;
  selectedPackage: NuGetPackage | null;
  isLoading: boolean;
  error: string | null;
  showPrerelease: boolean;
  operationInProgress: boolean;
  operationMessage: string | null;
  batchOperation: BatchOperation;
}

export type AppAction =
  | { type: 'SET_SOLUTION'; path: string; projects: Project[] }
  | { type: 'SET_PROJECT'; path: string }
  | { type: 'TOGGLE_PROJECT'; index: number }
  | { type: 'CONFIRM_PROJECT_SELECTION' }
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_SEARCH_RESULTS'; results: NuGetPackage[] }
  | { type: 'SET_INSTALLED_PACKAGES'; packages: InstalledPackage[] }
  | { type: 'SET_PROJECT_REFERENCES'; references: ProjectReference[] }
  | { type: 'SET_SELECTED_INDEX'; index: number }
  | { type: 'SET_SELECTED_PACKAGE'; pkg: NuGetPackage | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_PRERELEASE' }
  | { type: 'SET_OPERATION'; inProgress: boolean; message?: string | null }
  | { type: 'NAVIGATE_UP' }
  | { type: 'NAVIGATE_DOWN'; maxIndex: number }
  | { type: 'SET_BATCH_OPERATION_TYPE'; operationType: 'nuget' | 'project-reference' }
  | { type: 'SET_BATCH_PACKAGE'; packageId: string; version: string }
  | { type: 'TOGGLE_BATCH_SOURCE_PROJECT'; projectPath: string }
  | { type: 'TOGGLE_BATCH_TARGET_PROJECT'; projectPath: string }
  | { type: 'SET_BATCH_RESULTS'; results: { project: string; success: boolean; message: string }[] }
  | { type: 'RESET_BATCH_OPERATION' };
