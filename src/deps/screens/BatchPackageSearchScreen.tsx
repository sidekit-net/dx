import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { usePackageSearch } from '../hooks/usePackageSearch.js';
import { SearchInput } from '../components/SearchInput.js';
import { PackageList } from '../components/PackageList.js';
import { Spinner } from '../components/Spinner.js';
import { Toggle } from '../components/Toggle.js';

export function BatchPackageSearchScreen() {
  const { isLoading, searchResults, selectedIndex, showPrerelease, error } = useAppState();
  const dispatch = useAppDispatch();
  const { query, setQuery } = usePackageSearch();
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [versionIndex, setVersionIndex] = useState(0);

  const selectedPackage = searchResults[selectedIndex];
  const filteredVersions = (
    selectedPackage?.versions.filter((v) => showPrerelease || !v.isPrerelease) ?? []
  ).reverse(); // Newest versions first

  useInput((input, key) => {
    if (isLoading) return;

    // Version picker mode
    if (showVersionPicker) {
      if (key.escape) {
        setShowVersionPicker(false);
        setVersionIndex(0);
        return;
      }
      if (key.upArrow) {
        setVersionIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setVersionIndex((i) => Math.min(filteredVersions.length - 1, i + 1));
        return;
      }
      if (key.return && selectedPackage && filteredVersions[versionIndex]) {
        dispatch({
          type: 'SET_BATCH_PACKAGE',
          packageId: selectedPackage.id,
          version: filteredVersions[versionIndex]!.version,
        });
        dispatch({ type: 'SET_SCREEN', screen: 'batch-target-picker' });
        return;
      }
      return;
    }

    // Back to operation type
    if (key.escape) {
      dispatch({ type: 'SET_SCREEN', screen: 'batch-operation-type' });
      return;
    }

    // Navigation
    if (key.upArrow) {
      dispatch({ type: 'NAVIGATE_UP' });
      return;
    }
    if (key.downArrow) {
      dispatch({ type: 'NAVIGATE_DOWN', maxIndex: Math.max(0, searchResults.length - 1) });
      return;
    }

    // Pre-release toggle
    if (input === 'p' && key.ctrl) {
      dispatch({ type: 'TOGGLE_PRERELEASE' });
      return;
    }

    // Select package
    if (key.return && selectedPackage) {
      setShowVersionPicker(true);
      setVersionIndex(0);
      return;
    }
  });

  // Version picker
  if (showVersionPicker && selectedPackage) {
    const maxVisible = 10;
    const halfVisible = Math.floor(maxVisible / 2);
    let startIndex = Math.max(0, versionIndex - halfVisible);
    const endIndex = Math.min(filteredVersions.length, startIndex + maxVisible);

    if (endIndex - startIndex < maxVisible) {
      startIndex = Math.max(0, endIndex - maxVisible);
    }

    const visibleVersions = filteredVersions.slice(startIndex, endIndex);
    const showTopIndicator = startIndex > 0;
    const showBottomIndicator = endIndex < filteredVersions.length;

    return (
      <Box flexDirection="column">
        <Text>
          Select version for <Text bold color="cyan">{selectedPackage.id}</Text>
        </Text>
        <Box marginY={1} flexDirection="column">
          {filteredVersions.length === 0 ? (
            <Text dimColor>No versions available</Text>
          ) : (
            <>
              {showTopIndicator && (
                <Text dimColor>  ↑ {startIndex} more above</Text>
              )}
              {visibleVersions.map((v, i) => {
                const isSelected = startIndex + i === versionIndex;
                return (
                  <Box key={v.version}>
                    <Text color={isSelected ? 'cyan' : 'white'}>
                      {isSelected ? '> ' : '  '}v{v.version}
                      {v.isPrerelease && <Text color="yellow"> (prerelease)</Text>}
                      <Text dimColor> - {v.downloads.toLocaleString()} downloads</Text>
                    </Text>
                  </Box>
                );
              })}
              {showBottomIndicator && (
                <Text dimColor>  ↓ {filteredVersions.length - endIndex} more below</Text>
              )}
            </>
          )}
        </Box>
        <Text dimColor>↑↓ Navigate  Enter Select  Esc Back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>Search for a NuGet package to install</Text>
      <Box marginTop={1} marginBottom={1} flexDirection="column">
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

      <Box marginTop={1}>
        <Text dimColor>↑↓ Navigate  Enter Select  Esc Back</Text>
      </Box>
    </Box>
  );
}
