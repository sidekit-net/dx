import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { VersionSelector } from '../components/VersionSelector.js';
import { Spinner } from '../components/Spinner.js';
import { Toggle } from '../components/Toggle.js';
import { getPackageVersions } from '../api/nuget-client.js';
import { installPackage } from '../services/dotnet-cli.js';
import type { PackageVersion } from '../types/index.js';

export function PackageDetailScreen() {
  const { selectedPackage, projectPath, showPrerelease } = useAppState();
  const dispatch = useAppDispatch();
  const [versions, setVersions] = useState<PackageVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filter versions based on prerelease setting
  const filteredVersions = showPrerelease
    ? versions
    : versions.filter((v) => !v.isPrerelease);

  // Load versions when package changes
  useEffect(() => {
    if (!selectedPackage) return;

    setIsLoadingVersions(true);
    setVersions([]);
    setSelectedVersionIndex(0);

    getPackageVersions(selectedPackage.id)
      .then((v) => {
        setVersions(v);
      })
      .catch((err) => {
        console.error('Failed to load versions:', err);
      })
      .finally(() => {
        setIsLoadingVersions(false);
      });
  }, [selectedPackage?.id]);

  // Reset version index when prerelease filter changes
  useEffect(() => {
    setSelectedVersionIndex(0);
  }, [showPrerelease]);

  useInput((input, key) => {
    if (isInstalling) return;

    // Dismiss result
    if (installResult && key.return) {
      setInstallResult(null);
      dispatch({ type: 'SET_SCREEN', screen: 'main' });
      dispatch({ type: 'SET_SELECTED_PACKAGE', pkg: null });
      return;
    }

    if (installResult) return;

    // Navigation
    if (key.upArrow) {
      setSelectedVersionIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedVersionIndex((i) => Math.min(filteredVersions.length - 1, i + 1));
      return;
    }

    // Toggle prerelease (Ctrl+p)
    if (input === 'p' && key.ctrl) {
      dispatch({ type: 'TOGGLE_PRERELEASE' });
      return;
    }

    // Install
    if (key.return && selectedPackage && projectPath && filteredVersions[selectedVersionIndex]) {
      handleInstall();
      return;
    }
  });

  const handleInstall = async () => {
    if (!selectedPackage || !projectPath || !filteredVersions[selectedVersionIndex]) return;

    setIsInstalling(true);
    try {
      const result = await installPackage(
        projectPath,
        selectedPackage.id,
        filteredVersions[selectedVersionIndex]!.version
      );
      setInstallResult(result);
    } catch (err) {
      const errorMsg = err instanceof Error
        ? `${err.message}${err.cause ? ` (${err.cause})` : ''}`
        : String(err);
      setInstallResult({
        success: false,
        message: errorMsg || 'Installation failed (unknown error)',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  if (!selectedPackage) {
    return (
      <Box>
        <Text color="yellow">No package selected</Text>
      </Box>
    );
  }

  // Show install result
  if (installResult) {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor={installResult.success ? 'green' : 'red'} paddingX={2} paddingY={1}>
        <Text bold color={installResult.success ? 'green' : 'red'}>
          {installResult.success ? '✓ Installation Complete' : '✗ Installation Failed'}
        </Text>
        <Box marginY={1}>
          <Text>{installResult.message}</Text>
        </Box>
        <Text dimColor>Press Enter to continue</Text>
      </Box>
    );
  }

  // Show installing state
  if (isInstalling) {
    return (
      <Box flexDirection="column">
        <Spinner label={`Installing ${selectedPackage.id}...`} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Package info header */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="cyan">{selectedPackage.id}</Text>
        {selectedPackage.description && (
          <Text dimColor wrap="wrap">
            {selectedPackage.description.length > 200
              ? selectedPackage.description.slice(0, 197) + '...'
              : selectedPackage.description}
          </Text>
        )}
        <Box marginTop={1}>
          <Text dimColor>Authors: </Text>
          <Text>{selectedPackage.authors.join(', ') || 'Unknown'}</Text>
        </Box>
      </Box>

      {/* Prerelease toggle */}
      <Box marginBottom={1}>
        <Toggle label="Include pre-release versions (Ctrl+p)" value={showPrerelease} />
      </Box>

      {/* Version selector */}
      {isLoadingVersions ? (
        <Spinner label="Loading versions..." />
      ) : (
        <VersionSelector
          versions={versions}
          selectedIndex={selectedVersionIndex}
          showPrerelease={showPrerelease}
        />
      )}

      {/* Install hint */}
      {!isLoadingVersions && filteredVersions.length > 0 && (
        <Box marginTop={1}>
          <Text dimColor>Press </Text>
          <Text color="cyan">Enter</Text>
          <Text dimColor> to install selected version</Text>
        </Box>
      )}
    </Box>
  );
}
