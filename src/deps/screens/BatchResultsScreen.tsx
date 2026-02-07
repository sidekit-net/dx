import { Box, Text, useInput } from 'ink';
import { useAppState, useAppDispatch } from '../store/app-context.js';

export function BatchResultsScreen() {
  const { batchOperation } = useAppState();
  const dispatch = useAppDispatch();

  useInput((_input, key) => {
    if (key.return) {
      dispatch({ type: 'RESET_BATCH_OPERATION' });
      dispatch({ type: 'SET_SCREEN', screen: 'batch-operation-type' });
    }
  });

  const successCount = batchOperation.results.filter((r) => r.success).length;
  const failureCount = batchOperation.results.length - successCount;

  const getTitle = () => {
    if (batchOperation.type === 'nuget' && batchOperation.package) {
      return `Install ${batchOperation.package.id} v${batchOperation.package.version}`;
    }
    if (batchOperation.type === 'project-reference') {
      return `Add ${batchOperation.sourceProjects.length} project reference(s)`;
    }
    return 'Batch Operation';
  };

  return (
    <Box flexDirection="column">
      <Text bold>{getTitle()}</Text>
      <Box marginY={1}>
        <Text color="green">✓ {successCount} succeeded</Text>
        {failureCount > 0 && (
          <>
            <Text>  </Text>
            <Text color="red">✗ {failureCount} failed</Text>
          </>
        )}
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        {batchOperation.results.map((result) => (
          <Box key={result.project} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={result.success ? 'green' : 'red'}>
                {result.success ? '✓' : '✗'}
              </Text>
              <Text> </Text>
              <Text bold>{result.project}</Text>
            </Box>
            <Box marginLeft={4}>
              <Text dimColor>{result.message}</Text>
            </Box>
          </Box>
        ))}
      </Box>
      <Text dimColor>Press Enter to continue</Text>
    </Box>
  );
}
