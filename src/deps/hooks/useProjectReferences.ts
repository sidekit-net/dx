import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '../store/app-context.js';
import { parseProjectReferences } from '../services/project-parser.js';

export function useProjectReferences() {
  const { projectPath, projectReferences } = useAppState();
  const dispatch = useAppDispatch();

  const loadReferences = () => {
    if (!projectPath) return;

    try {
      const references = parseProjectReferences(projectPath);
      dispatch({ type: 'SET_PROJECT_REFERENCES', references });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Failed to load project references',
      });
    }
  };

  useEffect(() => {
    loadReferences();
  }, [projectPath]);

  return {
    references: projectReferences,
    refresh: loadReferences,
  };
}
