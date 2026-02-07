import { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { usePackageSearch } from '../hooks/usePackageSearch.js';
import { useInstalledPackages } from '../hooks/useInstalledPackages.js';
import { useProjectReferences } from '../hooks/useProjectReferences.js';
import { Spinner } from '../components/Spinner.js';
import { SearchInput } from '../components/SearchInput.js';
import { PackageList } from '../components/PackageList.js';
import { InstalledPackages } from '../components/InstalledPackages.js';
import { ProjectReferences } from '../components/ProjectReferences.js';
import { Toggle } from '../components/Toggle.js';
import { updatePackage, removePackage, addProjectReference, removeProjectReference } from '../services/dotnet-cli.js';
import type { Tab } from '../types/index.js';

type OperationState = {
  type: 'update' | 'remove' | 'add-ref' | 'remove-ref' | null;
  packageId: string | null;
  inProgress: boolean;
  result: { success: boolean; message: string } | null;
};

export function MainScreen() {
  const {
    activeTab,
    isLoading,
    projectPath,
    solutionPath,
    projects,
    searchResults,
    installedPackages,
    projectReferences,
    selectedIndex,
    showPrerelease,
    error,
  } = useAppState();
  const dispatch = useAppDispatch();
  const { query, setQuery } = usePackageSearch();
  const { refresh: refreshInstalled } = useInstalledPackages();
  const { refresh: refreshReferences } = useProjectReferences();

  const [addingRef, setAddingRef] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [pickerIndex, setPickerIndex] = useState(0);

  const [operation, setOperation] = useState<OperationState>({
    type: null,
    packageId: null,
    inProgress: false,
    result: null,
  });

  const currentList =
    activeTab === 'search'
      ? searchResults
      : activeTab === 'installed'
        ? installedPackages
        : projectReferences;
  const maxIndex = currentList.length - 1;

  // Sibling projects for picker (exclude current project)
  const siblingProjects = projects.filter((p) => p.path !== projectPath);
  const isSolutionMode = solutionPath !== null && siblingProjects.length > 0;

  const handleUpdate = async () => {
    const pkg = installedPackages[selectedIndex];
    if (!pkg || !pkg.latestVersion || !projectPath) return;

    setOperation({ type: 'update', packageId: pkg.id, inProgress: true, result: null });

    try {
      const result = await updatePackage(projectPath, pkg.id, pkg.latestVersion);
      setOperation((prev) => ({ ...prev, inProgress: false, result }));
      if (result.success) {
        refreshInstalled();
      }
    } catch (err) {
      setOperation((prev) => ({
        ...prev,
        inProgress: false,
        result: { success: false, message: err instanceof Error ? err.message : 'Update failed' },
      }));
    }
  };

  const handleRemove = async () => {
    const pkg = installedPackages[selectedIndex];
    if (!pkg || !projectPath) return;

    setOperation({ type: 'remove', packageId: pkg.id, inProgress: true, result: null });

    try {
      const result = await removePackage(projectPath, pkg.id);
      setOperation((prev) => ({ ...prev, inProgress: false, result }));
      if (result.success) {
        refreshInstalled();
      }
    } catch (err) {
      setOperation((prev) => ({
        ...prev,
        inProgress: false,
        result: { success: false, message: err instanceof Error ? err.message : 'Remove failed' },
      }));
    }
  };

  const handleAddRef = async (referencePath: string) => {
    if (!projectPath) return;

    setAddingRef(false);
    setRefInput('');
    setPickerIndex(0);
    setOperation({ type: 'add-ref', packageId: referencePath, inProgress: true, result: null });

    try {
      const result = await addProjectReference(projectPath, referencePath);
      setOperation((prev) => ({ ...prev, inProgress: false, result }));
      if (result.success) {
        refreshReferences();
      }
    } catch (err) {
      setOperation((prev) => ({
        ...prev,
        inProgress: false,
        result: { success: false, message: err instanceof Error ? err.message : 'Add reference failed' },
      }));
    }
  };

  const handleRemoveRef = async () => {
    const ref = projectReferences[selectedIndex];
    if (!ref || !projectPath) return;

    setOperation({ type: 'remove-ref', packageId: ref.name, inProgress: true, result: null });

    try {
      const result = await removeProjectReference(projectPath, ref.absolutePath);
      setOperation((prev) => ({ ...prev, inProgress: false, result }));
      if (result.success) {
        refreshReferences();
      }
    } catch (err) {
      setOperation((prev) => ({
        ...prev,
        inProgress: false,
        result: { success: false, message: err instanceof Error ? err.message : 'Remove reference failed' },
      }));
    }
  };

  useInput((input, key) => {
    // Dismiss operation result
    if (operation.result && key.return) {
      setOperation({ type: null, packageId: null, inProgress: false, result: null });
      return;
    }

    if (isLoading || operation.inProgress || operation.result) return;

    // Adding reference mode
    if (addingRef) {
      if (key.escape) {
        setAddingRef(false);
        setRefInput('');
        setPickerIndex(0);
        return;
      }

      if (isSolutionMode) {
        // Project picker mode
        if (key.upArrow) {
          setPickerIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (key.downArrow) {
          setPickerIndex((i) => Math.min(siblingProjects.length - 1, i + 1));
          return;
        }
        if (key.return && siblingProjects[pickerIndex]) {
          handleAddRef(siblingProjects[pickerIndex]!.path);
          return;
        }
      } else {
        // Text input mode
        if (key.return && refInput.trim()) {
          handleAddRef(refInput.trim());
          return;
        }
        if (key.backspace || key.delete) {
          setRefInput((v) => v.slice(0, -1));
          return;
        }
        if (input && !key.ctrl && !key.meta) {
          setRefInput((v) => v + input);
          return;
        }
      }
      return;
    }

    // Tab switching
    if (key.tab) {
      const tabOrder: Tab[] = ['search', 'installed', 'references'];
      const currentIndex = tabOrder.indexOf(activeTab);
      const nextTab = tabOrder[(currentIndex + 1) % tabOrder.length]!;
      dispatch({ type: 'SET_TAB', tab: nextTab });
      return;
    }

    // Navigation
    if (key.upArrow) {
      dispatch({ type: 'NAVIGATE_UP' });
      return;
    }
    if (key.downArrow) {
      dispatch({ type: 'NAVIGATE_DOWN', maxIndex: Math.max(0, maxIndex) });
      return;
    }

    // Pre-release toggle (Ctrl+p)
    if (input === 'p' && key.ctrl) {
      dispatch({ type: 'TOGGLE_PRERELEASE' });
      return;
    }

    // Select package (search tab)
    if (key.return && activeTab === 'search' && searchResults[selectedIndex]) {
      dispatch({ type: 'SET_SELECTED_PACKAGE', pkg: searchResults[selectedIndex]! });
      return;
    }

    // Refresh installed packages
    if (input === 'r' && activeTab === 'installed') {
      refreshInstalled();
      return;
    }

    // Update package (installed tab)
    if (input === 'u' && activeTab === 'installed') {
      const pkg = installedPackages[selectedIndex];
      if (pkg?.hasUpdate) {
        handleUpdate();
      }
      return;
    }

    // Remove package (installed tab)
    if (input === 'd' && activeTab === 'installed') {
      const pkg = installedPackages[selectedIndex];
      if (pkg) {
        handleRemove();
      }
      return;
    }

    // Add project reference (references tab)
    if (input === 'a' && activeTab === 'references') {
      setAddingRef(true);
      setPickerIndex(0);
      setRefInput('');
      return;
    }

    // Remove project reference (references tab)
    if (input === 'd' && activeTab === 'references') {
      const ref = projectReferences[selectedIndex];
      if (ref) {
        handleRemoveRef();
      }
      return;
    }
  });

  // Reset selected index when switching tabs
  useEffect(() => {
    dispatch({ type: 'SET_SELECTED_INDEX', index: 0 });
  }, [activeTab]);

  if (!projectPath) {
    return (
      <Box>
        <Text color="yellow">No project selected</Text>
      </Box>
    );
  }

  // Show operation result
  if (operation.result) {
    return (
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={operation.result.success ? 'green' : 'red'}
        paddingX={2}
        paddingY={1}
      >
        <Text bold color={operation.result.success ? 'green' : 'red'}>
          {operation.result.success ? '✓' : '✗'}{' '}
          {operation.type === 'update'
            ? 'Update'
            : operation.type === 'remove'
              ? 'Remove'
              : operation.type === 'add-ref'
                ? 'Add Reference'
                : 'Remove Reference'}{' '}
          {operation.result.success ? 'Complete' : 'Failed'}
        </Text>
        <Box marginY={1}>
          <Text>{operation.result.message}</Text>
        </Box>
        <Text dimColor>Press Enter to continue</Text>
      </Box>
    );
  }

  // Show operation in progress
  if (operation.inProgress) {
    return (
      <Box>
        <Spinner
          label={`${
            operation.type === 'update'
              ? 'Updating'
              : operation.type === 'remove'
                ? 'Removing'
                : operation.type === 'add-ref'
                  ? 'Adding reference'
                  : 'Removing reference'
          } ${operation.packageId}...`}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Tab bar */}
      <Box marginBottom={1}>
        <Text
          color={activeTab === 'search' ? 'cyan' : 'white'}
          bold={activeTab === 'search'}
          inverse={activeTab === 'search'}
        >
          {' Search '}
        </Text>
        <Text>  </Text>
        <Text
          color={activeTab === 'installed' ? 'cyan' : 'white'}
          bold={activeTab === 'installed'}
          inverse={activeTab === 'installed'}
        >
          {' Installed '}
        </Text>
        <Text>  </Text>
        <Text
          color={activeTab === 'references' ? 'cyan' : 'white'}
          bold={activeTab === 'references'}
          inverse={activeTab === 'references'}
        >
          {' References '}
        </Text>
      </Box>

      {/* Search tab content */}
      {activeTab === 'search' && (
        <Box flexDirection="column">
          <Box marginBottom={1} flexDirection="column">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Type to search NuGet..."
              isFocused={true}
            />
            <Box marginTop={1}>
              <Toggle label="Pre-release (Ctrl+p)" value={showPrerelease} />
            </Box>
          </Box>

          {error && (
            <Box marginBottom={1}>
              <Text color="red">Error: {error}</Text>
            </Box>
          )}

          {isLoading ? (
            <Spinner label="Searching..." />
          ) : (
            <PackageList packages={searchResults} selectedIndex={selectedIndex} />
          )}
        </Box>
      )}

      {/* Installed tab content */}
      {activeTab === 'installed' && (
        <Box flexDirection="column">
          {error && (
            <Box marginBottom={1}>
              <Text color="red">Error: {error}</Text>
            </Box>
          )}

          {isLoading ? (
            <Spinner label="Loading installed packages..." />
          ) : (
            <InstalledPackages packages={installedPackages} selectedIndex={selectedIndex} />
          )}
        </Box>
      )}

      {/* References tab content */}
      {activeTab === 'references' && (
        <Box flexDirection="column">
          {addingRef && (
            <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
              <Text bold color="cyan">Add Project Reference</Text>
              {isSolutionMode ? (
                <Box flexDirection="column" marginTop={1}>
                  {siblingProjects.length === 0 ? (
                    <Text dimColor>No sibling projects available</Text>
                  ) : (
                    siblingProjects.map((p, i) => {
                      const isSelected = i === pickerIndex;
                      return (
                        <Box key={p.path}>
                          <Text color={isSelected ? 'cyan' : 'white'}>
                            {isSelected ? '>' : ' '} {p.name}
                          </Text>
                        </Box>
                      );
                    })
                  )}
                  <Box marginTop={1}>
                    <Text dimColor>↑↓ Navigate  Enter Select  Esc Cancel</Text>
                  </Box>
                </Box>
              ) : (
                <Box flexDirection="column" marginTop={1}>
                  <Box>
                    <Text>Path: </Text>
                    <Text color="cyan">{refInput}</Text>
                    <Text color="cyan">█</Text>
                  </Box>
                  <Box marginTop={1}>
                    <Text dimColor>Type path to .csproj  Enter Confirm  Esc Cancel</Text>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {error && (
            <Box marginBottom={1}>
              <Text color="red">Error: {error}</Text>
            </Box>
          )}

          <ProjectReferences references={projectReferences} selectedIndex={selectedIndex} />
        </Box>
      )}
    </Box>
  );
}
