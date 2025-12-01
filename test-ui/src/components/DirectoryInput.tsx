import { useDirectoryPicker } from '../hooks/useDirectoryPicker';

interface DirectoryInputProps {
  disabled?: boolean;
}

/**
 * Directory input component with progressive enhancement.
 * Shows a browse button only if the File System Access API is supported.
 */
export function DirectoryInput({ disabled = false }: DirectoryInputProps) {
  const {
    packingDirectory,
    isSupported,
    handleDirectoryChange,
    handleDirectorySelect,
  } = useDirectoryPicker();

  return (
    <div className="directory-input-container">
      <input
        type="text"
        placeholder="Select directory to pack..."
        value={packingDirectory}
        onChange={(e) => handleDirectoryChange(e.target.value)}
        className="directory-input"
        disabled={disabled}
      />
      {isSupported && (
        <button
          onClick={handleDirectorySelect}
          className="btn btn-secondary btn-small"
          disabled={disabled}
          title="Browse for directory"
        >
          📁 Browse
        </button>
      )}
    </div>
  );
}

export function DirectoryInputView({
  packingDirectory,
  isSupported,
  disabled = false,
  onDirectoryChange,
  onBrowseClick,
}: {
  packingDirectory: string;
  isSupported: boolean;
  disabled?: boolean;
  onDirectoryChange: (value: string) => void;
  onBrowseClick: () => void;
}) {
  return (
    <div className="directory-input-container">
      <input
        type="text"
        placeholder="Select directory to pack..."
        value={packingDirectory}
        onChange={(e) => onDirectoryChange(e.target.value)}
        className="directory-input"
        disabled={disabled}
      />
      {isSupported && (
        <button
          onClick={onBrowseClick}
          className="btn btn-secondary btn-small"
          disabled={disabled}
          title="Browse for directory"
        >
          📁 Browse
        </button>
      )}
    </div>
  );
}
