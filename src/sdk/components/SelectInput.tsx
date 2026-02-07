import { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Item<V> {
  label: string;
  value: V;
}

interface SelectInputProps<V> {
  items: Item<V>[];
  onSelect: (item: Item<V>) => void;
}

export function SelectInput<V>({ items, onSelect }: SelectInputProps<V>) {
  const [index, setIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (key.return) {
      const selected = items[index];
      if (selected) onSelect(selected);
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Text key={String(item.value)} color={i === index ? 'cyan' : 'white'}>
          {i === index ? '> ' : '  '}{item.label}
        </Text>
      ))}
    </Box>
  );
}
