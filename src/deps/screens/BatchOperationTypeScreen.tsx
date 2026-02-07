import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { parseSolution } from '../services/solution-parser.js';
import { Spinner } from '../components/Spinner.js';

type OperationType = 'nuget' | 'project-reference' | 'single-project';

export function BatchOperationTypeScreen() {
  const { solutionPath, projects, isLoading } = useAppState();
  const dispatch = useAppDispatch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load projects when screen mounts
  useEffect(() => {
    if (solutionPath && projects.length === 0) {
      dispatch({ type: 'SET_LOADING', loading: true });
      try {
        const parsed = parseSolution(solutionPath);
        dispatch({ type: 'SET_SOLUTION', path: solutionPath, projects: parsed });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          error: error instanceof Error ? error.message : 'Failed to parse solution',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    }
  }, [solutionPath, projects.length]);

  const options: { type: OperationType; label: string; description: string }[] = [
    {
      type: 'nuget',
      label: 'Install NuGet Package',
      description: 'Search and install a NuGet package to selected projects',
    },
    {
      type: 'project-reference',
      label: 'Add Project References',
      description: 'Add references between projects in this solution',
    },
    {
      type: 'single-project',
      label: 'Manage Single Project',
      description: 'Work with a single project (packages and references)',
    },
  ];

  useInput((_input, key) => {
    if (isLoading) return;

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (key.return) {
      const selected = options[selectedIndex];
      if (selected?.type === 'single-project') {
        dispatch({ type: 'SET_SCREEN', screen: 'project-selection' });
      } else if (selected?.type === 'nuget') {
        dispatch({ type: 'SET_BATCH_OPERATION_TYPE', operationType: 'nuget' });
        dispatch({ type: 'SET_SCREEN', screen: 'batch-package-search' });
      } else if (selected?.type === 'project-reference') {
        dispatch({ type: 'SET_BATCH_OPERATION_TYPE', operationType: 'project-reference' });
        dispatch({ type: 'SET_SCREEN', screen: 'batch-source-picker' });
      }
    }
  });

  if (isLoading) {
    return (
      <Box>
        <Spinner label="Loading projects..." />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text dimColor>Solution: {solutionPath}</Text>
      <Box marginY={1}>
        <Text bold>Choose Operation</Text>
      </Box>
      <Box flexDirection="column">
        {options.map((option, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Box key={option.type} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={isSelected ? 'cyan' : 'white'}>
                  {isSelected ? '> ' : '  '}
                  {option.label}
                </Text>
              </Box>
              {isSelected && (
                <Box marginLeft={4}>
                  <Text dimColor>{option.description}</Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
