import {} from 'react';
import { Box, Text } from 'ink';
import { useAppState } from '../store/app-context.js';

export function Header() {
  const { projectPath, selectedProjects } = useAppState();

  const projectName = projectPath
    ? projectPath.split('/').pop()?.replace('.csproj', '') ?? 'Unknown'
    : selectedProjects.length > 0
      ? `${selectedProjects.length} project(s)`
      : 'No project selected';

  return (
    <Box borderStyle="single" borderBottom={true} paddingX={1}>
      <Box flexGrow={1}>
        <Text bold color="cyan">NuGet TUI</Text>
      </Box>
      <Box>
        <Text dimColor>Project: </Text>
        <Text color="yellow">{projectName}</Text>
      </Box>
    </Box>
  );
}
