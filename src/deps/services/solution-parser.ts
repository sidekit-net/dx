import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import type { Project } from '../types/index.js';

/**
 * Parse a .sln file and extract project references
 *
 * .sln format for project entries:
 * Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ProjectName", "Path\To\Project.csproj", "{GUID}"
 */
export function parseSolution(solutionPath: string): Project[] {
  const content = readFileSync(solutionPath, 'utf-8');
  const solutionDir = dirname(solutionPath);
  const projects: Project[] = [];

  // Match Project lines that reference .csproj files
  // Format: Project("...") = "Name", "RelativePath.csproj", "GUID"
  const projectRegex = /Project\("[^"]+"\)\s*=\s*"([^"]+)",\s*"([^"]+\.csproj)"/gi;

  let match;
  while ((match = projectRegex.exec(content)) !== null) {
    const name = match[1]!;
    const relativePath = match[2]!.replace(/\\/g, '/'); // Normalize path separators
    const absolutePath = resolve(solutionDir, relativePath);

    projects.push({
      name,
      path: absolutePath,
      selected: false,
    });
  }

  return projects;
}

/**
 * Check if a file is a solution file
 */
export function isSolutionFile(path: string): boolean {
  return path.toLowerCase().endsWith('.sln');
}
