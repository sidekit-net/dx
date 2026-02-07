import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';

export function BatchSourceProjectPickerScreen() {
  const { projects, batchOperation } = useAppState();
  const dispatch = useAppDispatch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    // Back to operation type
    if (key.escape) {
      dispatch({ type: 'RESET_BATCH_OPERATION' });
      dispatch({ type: 'SET_SCREEN', screen: 'batch-operation-type' });
      return;
    }

    // Navigation
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(projects.length - 1, i + 1));
      return;
    }

    // Toggle selection
    if (input === ' ') {
      const project = projects[selectedIndex];
      if (project) {
        dispatch({ type: 'TOGGLE_BATCH_SOURCE_PROJECT', projectPath: project.path });
      }
      return;
    }

    // Confirm selection
    if (key.return && batchOperation.sourceProjects.length > 0) {
      dispatch({ type: 'SET_SCREEN', screen: 'batch-target-picker' });
      return;
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Select projects to reference (source projects)</Text>
      <Text dimColor>These projects will be added as references to target projects</Text>
      <Box marginY={1} flexDirection="column">
        {projects.map((project, i) => {
          const isSelected = i === selectedIndex;
          const isChecked = batchOperation.sourceProjects.includes(project.path);
          return (
            <Box key={project.path}>
              <Text color={isSelected ? 'cyan' : 'white'}>
                {isSelected ? '> ' : '  '}
              </Text>
              <Text color={isChecked ? 'green' : 'white'}>
                [{isChecked ? 'x' : ' '}]
              </Text>
              <Text> {project.name}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Selected: {batchOperation.sourceProjects.length} project(s)
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑↓ Navigate  Space Toggle  Enter Continue  Esc Back</Text>
      </Box>
    </Box>
  );
}
