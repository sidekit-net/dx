import { Box, Text } from 'ink';
import type { NuGetPackage } from '../types/index.js';

interface PackageItemProps {
  pkg: NuGetPackage;
  isSelected: boolean;
}

function formatDownloads(downloads: number): string {
  if (downloads >= 1_000_000_000) {
    return `${(downloads / 1_000_000_000).toFixed(1)}B`;
  }
  if (downloads >= 1_000_000) {
    return `${(downloads / 1_000_000).toFixed(1)}M`;
  }
  if (downloads >= 1_000) {
    return `${(downloads / 1_000).toFixed(1)}K`;
  }
  return downloads.toString();
}

export function PackageItem({ pkg, isSelected }: PackageItemProps) {
  const indicator = isSelected ? '>' : ' ';
  const color = isSelected ? 'cyan' : 'white';

  return (
    <Box>
      <Text color={color}>{indicator} </Text>
      <Box width={40}>
        <Text color={color} bold={isSelected}>
          {pkg.id.length > 38 ? pkg.id.slice(0, 35) + '...' : pkg.id}
        </Text>
      </Box>
      <Box width={12} justifyContent="flex-end">
        <Text color="green">v{pkg.version}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>{formatDownloads(pkg.totalDownloads)} downloads</Text>
      </Box>
      {pkg.verified && (
        <Box marginLeft={1}>
          <Text color="blue">✓</Text>
        </Box>
      )}
    </Box>
  );
}
