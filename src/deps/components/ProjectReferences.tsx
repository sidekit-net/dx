import { Box, Text } from 'ink';
import type { ProjectReference } from '../types/index.js';

interface ProjectReferencesProps {
  references: ProjectReference[];
  selectedIndex: number;
  maxVisible?: number;
}

export function ProjectReferences({
  references,
  selectedIndex,
  maxVisible = 10,
}: ProjectReferencesProps) {
  if (references.length === 0) {
    return (
      <Box>
        <Text dimColor>No project references</Text>
      </Box>
    );
  }

  // Calculate visible window
  const halfVisible = Math.floor(maxVisible / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  const endIndex = Math.min(references.length, startIndex + maxVisible);

  if (endIndex - startIndex < maxVisible) {
    startIndex = Math.max(0, endIndex - maxVisible);
  }

  const visibleRefs = references.slice(startIndex, endIndex);
  const showTopIndicator = startIndex > 0;
  const showBottomIndicator = endIndex < references.length;

  return (
    <Box flexDirection="column">
      {showTopIndicator && (
        <Text dimColor>  ↑ {startIndex} more above</Text>
      )}
      {visibleRefs.map((ref, i) => {
        const isSelected = startIndex + i === selectedIndex;
        const indicator = isSelected ? '>' : ' ';
        const color = isSelected ? 'cyan' : 'white';

        return (
          <Box key={ref.absolutePath}>
            <Text color={color}>{indicator} </Text>
            <Box width={30}>
              <Text color={color} bold={isSelected}>
                {ref.name.length > 28 ? ref.name.slice(0, 25) + '...' : ref.name}
              </Text>
            </Box>
            <Text dimColor>{ref.path}</Text>
          </Box>
        );
      })}
      {showBottomIndicator && (
        <Text dimColor>  ↓ {references.length - endIndex} more below</Text>
      )}
    </Box>
  );
}
