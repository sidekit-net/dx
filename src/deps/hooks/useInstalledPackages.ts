import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { parseProjectPackages } from '../services/project-parser.js';
import { getLatestVersion } from '../api/nuget-client.js';
import type { InstalledPackage } from '../types/index.js';

export function useInstalledPackages() {
  const { projectPath, installedPackages, showPrerelease } = useAppState();
  const dispatch = useAppDispatch();

  const loadPackages = async () => {
    if (!projectPath) return;

    dispatch({ type: 'SET_LOADING', loading: true });

    try {
      const packages = parseProjectPackages(projectPath);
      dispatch({ type: 'SET_INSTALLED_PACKAGES', packages });

      // Check for updates in the background
      const packagesWithUpdates: InstalledPackage[] = await Promise.all(
        packages.map(async (pkg) => {
          try {
            const latest = await getLatestVersion(pkg.id, showPrerelease);
            return {
              ...pkg,
              latestVersion: latest ?? undefined,
              hasUpdate: latest !== null && latest !== pkg.version,
            };
          } catch {
            return pkg;
          }
        })
      );

      dispatch({ type: 'SET_INSTALLED_PACKAGES', packages: packagesWithUpdates });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Failed to load packages',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  useEffect(() => {
    loadPackages();
  }, [projectPath]);

  return {
    packages: installedPackages,
    refresh: loadPackages,
  };
}
