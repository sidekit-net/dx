import { Box, Text } from 'ink';
import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, children, footer }: ModalProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">{title}</Text>
      </Box>
      <Box flexDirection="column">
        {children}
      </Box>
      {footer && (
        <Box marginTop={1} borderStyle="single" borderTop={true} paddingTop={1}>
          {footer}
        </Box>
      )}
    </Box>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      footer={
        <Box>
          <Text color="cyan">Enter</Text>
          <Text dimColor> {confirmLabel}  </Text>
          <Text color="cyan">Esc</Text>
          <Text dimColor> {cancelLabel}</Text>
        </Box>
      }
    >
      <Text>{message}</Text>
    </Modal>
  );
}

interface ResultModalProps {
  title: string;
  success: boolean;
  message: string;
}

export function ResultModal({ title, success, message }: ResultModalProps) {
  return (
    <Modal
      title={title}
      footer={
        <Box>
          <Text color="cyan">Enter</Text>
          <Text dimColor> Dismiss</Text>
        </Box>
      }
    >
      <Text color={success ? 'green' : 'red'}>
        {success ? '✓' : '✗'} {message}
      </Text>
    </Modal>
  );
}
