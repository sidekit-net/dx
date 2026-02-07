import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import type { InstalledPackage, ProjectReference } from '../types/index.js';

/**
 * Parse a .csproj file and extract installed PackageReference entries
 *
 * .csproj format for package references:
 * <PackageReference Include="PackageName" Version="1.0.0" />
 * or
 * <PackageReference Include="PackageName">
 *   <Version>1.0.0</Version>
 * </PackageReference>
 */
export function parseProjectPackages(projectPath: string): InstalledPackage[] {
  const content = readFileSync(projectPath, 'utf-8');
  const packages: InstalledPackage[] = [];

  // Match PackageReference with inline Version attribute
  const inlineRegex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/gi;

  let match;
  while ((match = inlineRegex.exec(content)) !== null) {
    packages.push({
      id: match[1]!,
      version: match[2]!,
      hasUpdate: false,
    });
  }

  // Match PackageReference with nested Version element
  const nestedRegex = /<PackageReference\s+Include="([^"]+)"[^>]*>[\s\S]*?<Version>([^<]+)<\/Version>[\s\S]*?<\/PackageReference>/gi;

  while ((match = nestedRegex.exec(content)) !== null) {
    // Only add if not already found (avoid duplicates)
    const id = match[1]!;
    if (!packages.some((p) => p.id === id)) {
      packages.push({
        id,
        version: match[2]!.trim(),
        hasUpdate: false,
      });
    }
  }

  return packages;
}

/**
 * Parse a .csproj file and extract ProjectReference entries
 */
export function parseProjectReferences(projectPath: string): ProjectReference[] {
  const content = readFileSync(projectPath, 'utf-8');
  const references: ProjectReference[] = [];
  const projectDir = dirname(projectPath);

  const regex = /<ProjectReference\s+Include="([^"]+)"/gi;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawPath = match[1]!.replace(/\\/g, '/');
    const absolutePath = resolve(projectDir, rawPath);
    const filename = rawPath.split('/').pop() ?? rawPath;
    const name = filename.replace(/\.csproj$/i, '');

    references.push({ name, path: rawPath, absolutePath });
  }

  return references;
}

/**
 * Check if a file is a project file
 */
export function isProjectFile(path: string): boolean {
  return path.toLowerCase().endsWith('.csproj');
}

/**
 * Get the project name from the path
 */
export function getProjectName(projectPath: string): string {
  const filename = projectPath.split('/').pop() ?? projectPath;
  return filename.replace('.csproj', '');
}
