import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectoryInputView } from '../../src/components/DirectoryInput';

describe('DirectoryInputView', () => {
  it('should render input field', () => {
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={false}
        onDirectoryChange={vi.fn()}
        onBrowseClick={vi.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText('Select directory to pack...');
    expect(input).toBeDefined();
  });

  it('should display current directory value', () => {
    render(
      <DirectoryInputView
        packingDirectory="/test/path"
        isSupported={false}
        onDirectoryChange={vi.fn()}
        onBrowseClick={vi.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText('Select directory to pack...') as HTMLInputElement;
    expect(input.value).toBe('/test/path');
  });

  it('should call onDirectoryChange when input changes', () => {
    const handleChange = vi.fn();
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={false}
        onDirectoryChange={handleChange}
        onBrowseClick={vi.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText('Select directory to pack...');
    fireEvent.change(input, { target: { value: '/new/path' } });
    
    expect(handleChange).toHaveBeenCalledWith('/new/path');
  });

  it('should not show browse button when API is not supported', () => {
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={false}
        onDirectoryChange={vi.fn()}
        onBrowseClick={vi.fn()}
      />
    );
    
    const browseButton = screen.queryByTitle('Browse for directory');
    expect(browseButton).toBeNull();
  });

  it('should show browse button when API is supported', () => {
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={true}
        onDirectoryChange={vi.fn()}
        onBrowseClick={vi.fn()}
      />
    );
    
    const browseButton = screen.getByTitle('Browse for directory');
    expect(browseButton).toBeDefined();
  });

  it('should call onBrowseClick when browse button is clicked', () => {
    const handleBrowse = vi.fn();
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={true}
        onDirectoryChange={vi.fn()}
        onBrowseClick={handleBrowse}
      />
    );
    
    const browseButton = screen.getByTitle('Browse for directory');
    fireEvent.click(browseButton);
    
    expect(handleBrowse).toHaveBeenCalled();
  });

  it('should disable input when disabled prop is true', () => {
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={false}
        disabled={true}
        onDirectoryChange={vi.fn()}
        onBrowseClick={vi.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText('Select directory to pack...') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should disable browse button when disabled prop is true', () => {
    render(
      <DirectoryInputView
        packingDirectory=""
        isSupported={true}
        disabled={true}
        onDirectoryChange={vi.fn()}
        onBrowseClick={vi.fn()}
      />
    );
    
    const browseButton = screen.getByTitle('Browse for directory') as HTMLButtonElement;
    expect(browseButton.disabled).toBe(true);
  });
});
