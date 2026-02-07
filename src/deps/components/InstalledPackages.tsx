import { Box, Text } from 'ink';
import type { InstalledPackage } from '../types/index.js';

interface InstalledPackagesProps {
  packages: InstalledPackage[];
  selectedIndex: number;
  maxVisible?: number;
}

export function InstalledPackages({
  packages,
  selectedIndex,
  maxVisible = 10,
}: InstalledPackagesProps) {
  if (packages.length === 0) {
    return (
      <Box>
        <Text dimColor>No packages installed</Text>
      </Box>
    );
  }

  // Calculate visible window
  const halfVisible = Math.floor(maxVisible / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  const endIndex = Math.min(packages.length, startIndex + maxVisible);

  if (endIndex - startIndex < maxVisible) {
    startIndex = Math.max(0, endIndex - maxVisible);
  }

  const visiblePackages = packages.slice(startIndex, endIndex);
  const showTopIndicator = startIndex > 0;
  const showBottomIndicator = endIndex < packages.length;

  return (
    <Box flexDirection="column">
      {showTopIndicator && (
        <Text dimColor>  ↑ {startIndex} more above</Text>
      )}
      {visiblePackages.map((pkg, i) => {
        const isSelected = startIndex + i === selectedIndex;
        const indicator = isSelected ? '>' : ' ';
        const color = isSelected ? 'cyan' : 'white';

        return (
          <Box key={pkg.id}>
            <Text color={color}>{indicator} </Text>
            <Box width={35}>
              <Text color={color} bold={isSelected}>
                {pkg.id.length > 33 ? pkg.id.slice(0, 30) + '...' : pkg.id}
              </Text>
            </Box>
            <Box width={12}>
              <Text color="green">v{pkg.version}</Text>
            </Box>
            {pkg.hasUpdate && pkg.latestVersion ? (
              <Text color="yellow"> → v{pkg.latestVersion} available</Text>
            ) : (
              <Text dimColor> (latest)</Text>
            )}
          </Box>
        );
      })}
      {showBottomIndicator && (
        <Text dimColor>  ↓ {packages.length - endIndex} more below</Text>
      )}
    </Box>
  );
}
