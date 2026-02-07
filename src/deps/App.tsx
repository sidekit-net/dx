import { Box } from 'ink';
import { useInput, useApp } from 'ink';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { ProjectSelectionScreen } from './screens/ProjectSelectionScreen.js';
import { MainScreen } from './screens/MainScreen.js';
import { PackageDetailScreen } from './screens/PackageDetailScreen.js';
import { BatchOperationTypeScreen } from './screens/BatchOperationTypeScreen.js';
import { BatchPackageSearchScreen } from './screens/BatchPackageSearchScreen.js';
import { BatchSourceProjectPickerScreen } from './screens/BatchSourceProjectPickerScreen.js';
import { BatchTargetProjectPickerScreen } from './screens/BatchTargetProjectPickerScreen.js';
import { BatchResultsScreen } from './screens/BatchResultsScreen.js';
import { useAppState, useAppDispatch } from './store/app-context.js';

export function App() {
  const { currentScreen, operationInProgress } = useAppState();
  const dispatch = useAppDispatch();
  const { exit } = useApp();

  useInput((_input, key) => {
    // Handle Ctrl+C - let Ink handle it naturally, which will trigger our cleanup
    if (key.ctrl && _input === 'c') {
      exit();
      return;
    }

    if (operationInProgress) return;

    if (key.escape && currentScreen === 'package-detail') {
      dispatch({ type: 'SET_SELECTED_PACKAGE', pkg: null });
      dispatch({ type: 'SET_SCREEN', screen: 'main' });
    }
  });

  const renderScreen = () => {
    switch (currentScreen) {
      case 'project-selection':
        return <ProjectSelectionScreen />;
      case 'package-detail':
        return <PackageDetailScreen />;
      case 'batch-operation-type':
        return <BatchOperationTypeScreen />;
      case 'batch-package-search':
        return <BatchPackageSearchScreen />;
      case 'batch-source-picker':
        return <BatchSourceProjectPickerScreen />;
      case 'batch-target-picker':
        return <BatchTargetProjectPickerScreen />;
      case 'batch-results':
        return <BatchResultsScreen />;
      default:
        return <MainScreen />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Header />
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {renderScreen()}
      </Box>
      <Footer />
    </Box>
  );
}
