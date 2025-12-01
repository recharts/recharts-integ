import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDirectoryPicker } from '../../src/hooks/useDirectoryPicker';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setPackingDirectory, setError } from '../../src/store/testsSlice';

vi.mock('../../src/store/hooks');

describe('useDirectoryPicker', () => {
  const mockDispatch = vi.fn();
  const mockUseAppSelector = vi.mocked(useAppSelector);
  const mockUseAppDispatch = vi.mocked(useAppDispatch);

  beforeEach(() => {
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseAppSelector.mockReturnValue('/test/directory');
    vi.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.getItem = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should check if File System Access API is supported', () => {
    // @ts-ignore
    delete window.showDirectoryPicker;
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    expect(result.current.isSupported).toBe(false);
  });

  it('should detect File System Access API support', () => {
    // @ts-ignore
    window.showDirectoryPicker = vi.fn();
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    expect(result.current.isSupported).toBe(true);
  });

  it('should return packingDirectory from state', () => {
    mockUseAppSelector.mockReturnValue('/my/directory');
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    expect(result.current.packingDirectory).toBe('/my/directory');
  });

  it('should handle directory change', () => {
    const { result } = renderHook(() => useDirectoryPicker());
    
    act(() => {
      result.current.handleDirectoryChange('/new/path');
    });
    
    expect(mockDispatch).toHaveBeenCalledWith(setPackingDirectory('/new/path'));
    expect(localStorage.setItem).toHaveBeenCalledWith('packingDirectory', '/new/path');
  });

  it('should handle directory select with API support', async () => {
    const mockDirHandle = { name: 'test-dir' };
    const mockShowDirectoryPicker = vi.fn().mockResolvedValue(mockDirHandle);
    // @ts-ignore
    window.showDirectoryPicker = mockShowDirectoryPicker;
    window.prompt = vi.fn().mockReturnValue('/full/path/test-dir');
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    await act(async () => {
      await result.current.handleDirectorySelect();
    });
    
    expect(mockShowDirectoryPicker).toHaveBeenCalled();
    expect(window.prompt).toHaveBeenCalledWith(
      expect.stringContaining('Selected: test-dir')
    );
    expect(mockDispatch).toHaveBeenCalledWith(setPackingDirectory('/full/path/test-dir'));
    expect(localStorage.setItem).toHaveBeenCalledWith('packingDirectory', '/full/path/test-dir');
  });

  it('should not call API when not supported', async () => {
    // @ts-ignore
    delete window.showDirectoryPicker;
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    await act(async () => {
      await result.current.handleDirectorySelect();
    });
    
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should handle user cancellation gracefully', async () => {
    const mockShowDirectoryPicker = vi.fn().mockRejectedValue({ name: 'AbortError' });
    // @ts-ignore
    window.showDirectoryPicker = mockShowDirectoryPicker;
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    await act(async () => {
      await result.current.handleDirectorySelect();
    });
    
    // Should not dispatch error for AbortError
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({
      type: setError.type
    }));
  });

  it('should handle errors other than AbortError', async () => {
    const mockError = new Error('Some error');
    const mockShowDirectoryPicker = vi.fn().mockRejectedValue(mockError);
    // @ts-ignore
    window.showDirectoryPicker = mockShowDirectoryPicker;
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    await act(async () => {
      await result.current.handleDirectorySelect();
    });
    
    expect(mockDispatch).toHaveBeenCalledWith(
      setError('Failed to select directory: Some error')
    );
  });

  it('should not save directory when user cancels prompt', async () => {
    const mockDirHandle = { name: 'test-dir' };
    const mockShowDirectoryPicker = vi.fn().mockResolvedValue(mockDirHandle);
    // @ts-ignore
    window.showDirectoryPicker = mockShowDirectoryPicker;
    window.prompt = vi.fn().mockReturnValue(null); // User cancelled
    
    const { result } = renderHook(() => useDirectoryPicker());
    
    await act(async () => {
      await result.current.handleDirectorySelect();
    });
    
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: setPackingDirectory.type })
    );
  });
});
