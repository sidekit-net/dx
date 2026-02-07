import { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { Spinner } from '../components/Spinner.js';
import { parseSolution } from '../services/solution-parser.js';

export function ProjectSelectionScreen() {
  const { solutionPath, projects, selectedIndex, isLoading } = useAppState();
  const dispatch = useAppDispatch();

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
  }, [solutionPath]);

  useInput((input, key) => {
    if (isLoading) return;

    if (key.upArrow) {
      dispatch({ type: 'NAVIGATE_UP' });
    } else if (key.downArrow) {
      dispatch({ type: 'NAVIGATE_DOWN', maxIndex: projects.length - 1 });
    } else if (input === ' ') {
      dispatch({ type: 'TOGGLE_PROJECT', index: selectedIndex });
    } else if (key.return) {
      const hasSelection = projects.some((p) => p.selected);
      if (hasSelection) {
        dispatch({ type: 'CONFIRM_PROJECT_SELECTION' });
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
      <Box marginY={1} flexDirection="column">
        {projects.length === 0 ? (
          <Text color="yellow">No projects found in solution</Text>
        ) : (
          projects.map((project, i) => (
            <Box key={project.path}>
              <Text color={i === selectedIndex ? 'cyan' : 'white'}>
                {i === selectedIndex ? '> ' : '  '}
              </Text>
              <Text color={project.selected ? 'green' : 'white'}>
                [{project.selected ? 'x' : ' '}]
              </Text>
              <Text> {project.name}</Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
