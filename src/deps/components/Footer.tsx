import { Box, Text } from 'ink';
import { useAppState } from '../store/app-context.js';

interface KeyHint {
  key: string;
  label: string;
}

function getKeyHints(screen: string, tab: string): KeyHint[] {
  if (screen === 'batch-operation-type') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'Enter', label: 'Select' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (screen === 'batch-package-search') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'Enter', label: 'Select' },
      { key: 'Ctrl+p', label: 'Pre-release' },
      { key: 'Esc', label: 'Back' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (screen === 'batch-source-picker' || screen === 'batch-target-picker') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'Space', label: 'Toggle' },
      { key: 'Enter', label: screen === 'batch-target-picker' ? 'Execute' : 'Continue' },
      { key: 'Esc', label: 'Back' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (screen === 'batch-results') {
    return [
      { key: 'Enter', label: 'Continue' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (screen === 'project-selection') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'Space', label: 'Toggle' },
      { key: 'Enter', label: 'Confirm' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (screen === 'package-detail') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'Enter', label: 'Install' },
      { key: 'Ctrl+p', label: 'Pre-release' },
      { key: 'Esc', label: 'Back' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (tab === 'search') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'Enter', label: 'Select' },
      { key: 'Tab', label: 'Switch Tab' },
      { key: 'Ctrl+p', label: 'Pre-release' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  if (tab === 'references') {
    return [
      { key: '↑↓', label: 'Navigate' },
      { key: 'a', label: 'Add Ref' },
      { key: 'd', label: 'Remove' },
      { key: 'Tab', label: 'Switch Tab' },
      { key: 'Ctrl+c', label: 'Quit' },
    ];
  }

  return [
    { key: '↑↓', label: 'Navigate' },
    { key: 'u', label: 'Update' },
    { key: 'd', label: 'Remove' },
    { key: 'Tab', label: 'Switch Tab' },
    { key: 'Ctrl+c', label: 'Quit' },
  ];
}

export function Footer() {
  const { currentScreen, activeTab } = useAppState();
  const hints = getKeyHints(currentScreen, activeTab);

  return (
    <Box borderStyle="single" borderTop={true} paddingX={1}>
      {hints.map((hint, i) => (
        <Box key={hint.key} marginRight={2}>
          <Text color="cyan">{hint.key}</Text>
          <Text dimColor> {hint.label}</Text>
          {i < hints.length - 1 && <Text dimColor>  </Text>}
        </Box>
      ))}
    </Box>
  );
}
