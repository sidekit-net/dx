import { Box, Text } from 'ink';
import type { PackageVersion } from '../types/index.js';

interface VersionSelectorProps {
  versions: PackageVersion[];
  selectedIndex: number;
  showPrerelease: boolean;
  maxVisible?: number;
}

export function VersionSelector({
  versions,
  selectedIndex,
  showPrerelease,
  maxVisible = 8,
}: VersionSelectorProps) {
  // Filter versions based on prerelease setting
  const filteredVersions = showPrerelease
    ? versions
    : versions.filter((v) => !v.isPrerelease);

  if (filteredVersions.length === 0) {
    return (
      <Box>
        <Text dimColor>No versions available</Text>
      </Box>
    );
  }

  // Calculate visible window
  const halfVisible = Math.floor(maxVisible / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  const endIndex = Math.min(filteredVersions.length, startIndex + maxVisible);

  if (endIndex - startIndex < maxVisible) {
    startIndex = Math.max(0, endIndex - maxVisible);
  }

  const visibleVersions = filteredVersions.slice(startIndex, endIndex);
  const showTopIndicator = startIndex > 0;
  const showBottomIndicator = endIndex < filteredVersions.length;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Select Version:</Text>
      </Box>
      {showTopIndicator && (
        <Text dimColor>  ↑ {startIndex} more above</Text>
      )}
      {visibleVersions.map((version, i) => {
        const isSelected = startIndex + i === selectedIndex;
        const indicator = isSelected ? '>' : ' ';

        return (
          <Box key={version.version}>
            <Text color={isSelected ? 'cyan' : 'white'}>{indicator} </Text>
            <Text color={isSelected ? 'cyan' : 'green'} bold={isSelected}>
              {version.version}
            </Text>
            {version.isPrerelease && (
              <Text color="yellow" dimColor> (pre-release)</Text>
            )}
          </Box>
        );
      })}
      {showBottomIndicator && (
        <Text dimColor>  ↓ {filteredVersions.length - endIndex} more below</Text>
      )}
    </Box>
  );
}
