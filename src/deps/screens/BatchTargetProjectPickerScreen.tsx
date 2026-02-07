import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { installPackage, addProjectReference } from '../services/dotnet-cli.js';
import { Spinner } from '../components/Spinner.js';

export function BatchTargetProjectPickerScreen() {
  const { projects, batchOperation } = useAppState();
  const dispatch = useAppDispatch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0, projectName: '' });

  // Filter out source projects from targets in project-reference mode
  const availableProjects =
    batchOperation.type === 'project-reference'
      ? projects.filter((p) => !batchOperation.sourceProjects.includes(p.path))
      : projects;

  const handleExecute = async () => {
    if (batchOperation.targetProjects.length === 0) return;

    setExecuting(true);
    const totalProjects = batchOperation.targetProjects.length;
    const results: { project: string; success: boolean; message: string }[] = [];

    if (batchOperation.type === 'nuget' && batchOperation.package) {
      // Install NuGet package to each target project
      for (let i = 0; i < batchOperation.targetProjects.length; i++) {
        const projectPath = batchOperation.targetProjects[i]!;
        const projectName = projectPath.split('/').pop()?.replace('.csproj', '') ?? projectPath;

        setCurrentProgress({ current: i + 1, total: totalProjects, projectName });

        try {
          const result = await installPackage(
            projectPath,
            batchOperation.package.id,
            batchOperation.package.version
          );
          results.push({
            project: projectName,
            success: result.success,
            message: result.message,
          });
        } catch (err) {
          results.push({
            project: projectName,
            success: false,
            message: err instanceof Error ? err.message : 'Installation failed',
          });
        }
      }
    } else if (batchOperation.type === 'project-reference') {
      // Add project references to each target project
      for (let i = 0; i < batchOperation.targetProjects.length; i++) {
        const targetPath = batchOperation.targetProjects[i]!;
        const targetName = targetPath.split('/').pop()?.replace('.csproj', '') ?? targetPath;

        setCurrentProgress({ current: i + 1, total: totalProjects, projectName: targetName });

        const targetResults: string[] = [];

        for (const sourcePath of batchOperation.sourceProjects) {
          try {
            const result = await addProjectReference(targetPath, sourcePath);
            if (!result.success) {
              targetResults.push(result.message);
            }
          } catch (err) {
            targetResults.push(err instanceof Error ? err.message : 'Failed');
          }
        }

        results.push({
          project: targetName,
          success: targetResults.length === 0,
          message:
            targetResults.length === 0
              ? `Added ${batchOperation.sourceProjects.length} reference(s)`
              : targetResults.join('; '),
        });
      }
    }

    setExecuting(false);
    dispatch({ type: 'SET_BATCH_RESULTS', results });
    dispatch({ type: 'SET_SCREEN', screen: 'batch-results' });
  };

  useInput((input, key) => {
    if (executing) return; // Disable input while executing

    // Back to previous screen
    if (key.escape) {
      const prevScreen =
        batchOperation.type === 'nuget' ? 'batch-package-search' : 'batch-source-picker';
      dispatch({ type: 'SET_SCREEN', screen: prevScreen });
      return;
    }

    // Navigation
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(availableProjects.length - 1, i + 1));
      return;
    }

    // Toggle selection
    if (input === ' ') {
      const project = availableProjects[selectedIndex];
      if (project) {
        dispatch({ type: 'TOGGLE_BATCH_TARGET_PROJECT', projectPath: project.path });
      }
      return;
    }

    // Execute operation
    if (key.return && batchOperation.targetProjects.length > 0) {
      handleExecute();
      return;
    }
  });

  const getTitle = () => {
    if (batchOperation.type === 'nuget' && batchOperation.package) {
      return `Install ${batchOperation.package.id} v${batchOperation.package.version} to:`;
    }
    if (batchOperation.type === 'project-reference') {
      return `Add ${batchOperation.sourceProjects.length} project reference(s) to:`;
    }
    return 'Select target projects';
  };

  // Show progress while executing
  if (executing) {
    const operationLabel =
      batchOperation.type === 'nuget'
        ? `Installing ${batchOperation.package?.id}`
        : 'Adding project references';

    return (
      <Box flexDirection="column">
        <Spinner
          label={`${operationLabel} (${currentProgress.current}/${currentProgress.total}): ${currentProgress.projectName}...`}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>{getTitle()}</Text>
      <Box marginY={1} flexDirection="column">
        {availableProjects.map((project, i) => {
          const isSelected = i === selectedIndex;
          const isChecked = batchOperation.targetProjects.includes(project.path);
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
          Selected: {batchOperation.targetProjects.length} project(s)
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑↓ Navigate  Space Toggle  Enter Execute  Esc Back</Text>
      </Box>
    </Box>
  );
}
