import { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isFocused?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  isFocused = true,
}: SearchInputProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const valueRef = useRef(value);

  // Keep ref in sync with prop
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Blinking cursor effect
  useEffect(() => {
    if (!isFocused) return;

    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);

    return () => clearInterval(timer);
  }, [isFocused]);

  useInput(
    (input, key) => {
      if (!isFocused) return;

      if (key.backspace || key.delete) {
        const next = valueRef.current.slice(0, -1);
        valueRef.current = next;
        onChange(next);
      } else if (!key.ctrl && !key.meta && input && !key.upArrow && !key.downArrow && !key.tab && !key.return && !key.escape) {
        const next = valueRef.current + input;
        valueRef.current = next;
        onChange(next);
      }
    },
    { isActive: isFocused }
  );

  const showPlaceholder = !value && placeholder;

  return (
    <Box>
      <Text bold color="cyan">Search: </Text>
      {showPlaceholder ? (
        <Text dimColor>{placeholder}</Text>
      ) : (
        <Text>{value}</Text>
      )}
      {isFocused && cursorVisible && <Text color="cyan">█</Text>}
    </Box>
  );
}
