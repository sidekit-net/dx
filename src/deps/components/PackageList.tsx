import { Box, Text } from 'ink';
import { PackageItem } from './PackageItem.js';
import type { NuGetPackage } from '../types/index.js';

interface PackageListProps {
  packages: NuGetPackage[];
  selectedIndex: number;
  maxVisible?: number;
}

export function PackageList({ packages, selectedIndex, maxVisible = 10 }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <Box>
        <Text dimColor>No packages found</Text>
      </Box>
    );
  }

  // Calculate visible window
  const halfVisible = Math.floor(maxVisible / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  const endIndex = Math.min(packages.length, startIndex + maxVisible);

  // Adjust start if we're near the end
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
      {visiblePackages.map((pkg, i) => (
        <PackageItem
          key={pkg.id}
          pkg={pkg}
          isSelected={startIndex + i === selectedIndex}
        />
      ))}
      {showBottomIndicator && (
        <Text dimColor>  ↓ {packages.length - endIndex} more below</Text>
      )}
    </Box>
  );
}
