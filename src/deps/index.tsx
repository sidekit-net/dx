import { render } from 'ink';
import { App } from './App.js';
import { AppProvider } from './store/app-context.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

function printUsage() {
  console.log(`
Usage: dx deps <path>

Arguments:
  path    Path to a .csproj or .sln file

Examples:
  dx deps ./MyProject.csproj
  dx deps ./MySolution.sln
`);
}

export function runDeps(args: string[]) {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const inputPath = args[0]!;
  const resolvedPath = resolve(inputPath);

  if (!existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const isSolution = resolvedPath.endsWith('.sln');
  const isProject = resolvedPath.endsWith('.csproj');

  if (!isSolution && !isProject) {
    console.error('Error: File must be a .csproj or .sln file');
    process.exit(1);
  }

  // Check if stdin is a TTY
  if (!process.stdin.isTTY) {
    console.error('Error: This application requires an interactive terminal');
    process.exit(1);
  }

  // Use process.stdin directly and set raw mode
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  const { unmount, waitUntilExit } = render(
    <AppProvider initialPath={resolvedPath} isSolution={isSolution}>
      <App />
    </AppProvider>
  );

  // Handle cleanup
  const cleanup = () => {
    unmount();
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    process.stdin.destroy();
  };

  // Handle Ctrl+C and other signals
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  // Clean up on normal exit
  waitUntilExit()
    .then(() => {
      cleanup();
      process.exit(0);
    })
    .catch(() => {
      cleanup();
      process.exit(1);
    });
}
