import { $ } from 'bun';

interface CommandResult {
  success: boolean;
  message: string;
  stdout: string;
  stderr: string;
}

/**
 * Run a dotnet CLI command using Bun's shell
 */
async function runDotnetCommand(args: string[]): Promise<CommandResult> {
  try {
    // Use Bun's shell for better compatibility
    const result = await $`dotnet ${args}`.quiet().nothrow();

    const stdout = result.stdout.toString().trim();
    const stderr = result.stderr.toString().trim();
    const exitCode = result.exitCode;

    return {
      success: exitCode === 0,
      message: exitCode === 0
        ? 'Command completed successfully'
        : `Command failed (exit code ${exitCode}): ${stderr || stdout}`,
      stdout,
      stderr,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Command execution failed: ${errorMessage}`,
      stdout: '',
      stderr: errorMessage,
    };
  }
}

/**
 * Install a NuGet package to a project
 */
export async function installPackage(
  projectPath: string,
  packageId: string,
  version: string
): Promise<{ success: boolean; message: string }> {
  const result = await runDotnetCommand([
    'add',
    projectPath,
    'package',
    packageId,
    '--version',
    version,
  ]);

  if (result.success) {
    return {
      success: true,
      message: `Successfully installed ${packageId} v${version}`,
    };
  }

  // Parse error message from stderr or stdout
  const errorOutput = result.stderr || result.stdout || result.message;
  let errorMessage = `Failed to install ${packageId} v${version}`;

  if (errorOutput.includes('not found') && errorOutput.includes('package')) {
    errorMessage = `Package ${packageId} version ${version} not found`;
  } else if (errorOutput.includes('already has a reference')) {
    errorMessage = `Package ${packageId} is already installed. Use update instead.`;
  } else if (errorOutput.includes('ENOENT') || errorOutput.includes('not found')) {
    errorMessage = `dotnet CLI not found. Please ensure .NET SDK is installed.`;
  } else if (errorOutput) {
    // Show the actual error output for debugging
    errorMessage = errorOutput.length > 300
      ? errorOutput.slice(0, 300) + '...'
      : errorOutput;
  }

  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Remove a NuGet package from a project
 */
export async function removePackage(
  projectPath: string,
  packageId: string
): Promise<{ success: boolean; message: string }> {
  const result = await runDotnetCommand([
    'remove',
    projectPath,
    'package',
    packageId,
  ]);

  if (result.success) {
    return {
      success: true,
      message: `Successfully removed ${packageId}`,
    };
  }

  const errorOutput = result.stderr || result.stdout;
  let errorMessage = `Failed to remove ${packageId}`;

  if (errorOutput.includes('not found')) {
    errorMessage = `Package ${packageId} is not installed`;
  } else if (errorOutput) {
    const lines = errorOutput.split('\n').filter((l) => l.trim());
    if (lines[0]) {
      errorMessage = lines[0];
    }
  }

  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Update a NuGet package to a specific version
 */
export async function updatePackage(
  projectPath: string,
  packageId: string,
  version: string
): Promise<{ success: boolean; message: string }> {
  // dotnet add package will update if already installed
  return installPackage(projectPath, packageId, version);
}

/**
 * Add a project reference
 */
export async function addProjectReference(
  projectPath: string,
  referencePath: string
): Promise<{ success: boolean; message: string }> {
  const result = await runDotnetCommand([
    'add',
    projectPath,
    'reference',
    referencePath,
  ]);

  if (result.success) {
    return {
      success: true,
      message: `Successfully added reference to ${referencePath}`,
    };
  }

  const errorOutput = result.stderr || result.stdout || result.message;
  let errorMessage = `Failed to add reference to ${referencePath}`;

  if (errorOutput.includes('already has a reference')) {
    errorMessage = `Project already references ${referencePath}`;
  } else if (errorOutput.includes('not found') || errorOutput.includes('does not exist')) {
    errorMessage = `Project file not found: ${referencePath}`;
  } else if (errorOutput) {
    errorMessage = errorOutput.length > 300
      ? errorOutput.slice(0, 300) + '...'
      : errorOutput;
  }

  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Remove a project reference
 */
export async function removeProjectReference(
  projectPath: string,
  referencePath: string
): Promise<{ success: boolean; message: string }> {
  const result = await runDotnetCommand([
    'remove',
    projectPath,
    'reference',
    referencePath,
  ]);

  if (result.success) {
    return {
      success: true,
      message: `Successfully removed reference to ${referencePath}`,
    };
  }

  const errorOutput = result.stderr || result.stdout;
  let errorMessage = `Failed to remove reference`;

  if (errorOutput.includes('not found')) {
    errorMessage = `Reference not found`;
  } else if (errorOutput) {
    const lines = errorOutput.split('\n').filter((l) => l.trim());
    if (lines[0]) {
      errorMessage = lines[0];
    }
  }

  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Check if dotnet CLI is available
 */
export async function checkDotnetAvailable(): Promise<boolean> {
  try {
    const result = await runDotnetCommand(['--version']);
    return result.success;
  } catch {
    return false;
  }
}
