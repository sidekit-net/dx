import { Box, Text } from 'ink';

interface ToggleProps {
  label: string;
  value: boolean;
  onChange?: () => void;
}

export function Toggle({ label, value }: ToggleProps) {
  return (
    <Box>
      <Text color={value ? 'green' : 'gray'}>[{value ? 'x' : ' '}]</Text>
      <Text> {label}</Text>
    </Box>
  );
}
