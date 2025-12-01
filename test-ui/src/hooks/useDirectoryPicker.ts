import { useCallback, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPackingDirectory, setError } from '../store/testsSlice';

/**
 * Hook to manage directory selection with progressive enhancement.
 * If the File System Access API is not supported, the browse button won't be available.
 */
export function useDirectoryPicker() {
  const dispatch = useAppDispatch();
  const packingDirectory = useAppSelector(state => state.tests.packingDirectory);
  const [isSupported, setIsSupported] = useState(false);

  // Check if File System Access API is supported
  useEffect(() => {
    // @ts-ignore - Not all browsers support this yet
    setIsSupported(typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function');
  }, []);

  const handleDirectoryChange = useCallback((directory: string) => {
    dispatch(setPackingDirectory(directory));
    localStorage.setItem('packingDirectory', directory);
  }, [dispatch]);

  const handleDirectorySelect = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      const dirPath = dirHandle.name;

      // File System Access API doesn't provide full paths for security reasons.
      // Since the server runs locally, we use a prompt to ask for the full path.
      const fullPath = prompt(
        `Selected: ${dirPath}\n\nPlease enter the full absolute path to this directory:`,
      );

      if (fullPath) {
        handleDirectoryChange(fullPath);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        dispatch(
          setError('Failed to select directory: ' + (err as Error).message),
        );
      }
    }
  }, [isSupported, handleDirectoryChange, dispatch]);

  return {
    packingDirectory,
    isSupported,
    handleDirectoryChange,
    handleDirectorySelect,
  };
}
