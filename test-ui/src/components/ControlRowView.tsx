import React from 'react';
import { Test } from '../types';

export interface ControlRowViewProps {
  selectedTestsCount: number;
  filteredTestsCount: number;
  hasQueue: boolean;
  hasResults: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRunSelected: () => void;
  onCancelQueue: () => void;
  onClearAllResults: () => void;
}

export const ControlRowView: React.FC<ControlRowViewProps> = ({
  selectedTestsCount,
  filteredTestsCount,
  hasQueue,
  hasResults,
  onSelectAll,
  onDeselectAll,
  onRunSelected,
  onCancelQueue,
  onClearAllResults,
}) => {
  return (
    <div className="control-row">
      <button
        onClick={onSelectAll}
        className="btn btn-secondary"
      >
        Select All ({filteredTestsCount})
      </button>
      <button
        onClick={onDeselectAll}
        className="btn btn-secondary"
      >
        Deselect All
      </button>
      <button
        onClick={onRunSelected}
        disabled={selectedTestsCount === 0}
        className="btn btn-primary"
      >
        Run Selected ({selectedTestsCount})
      </button>
      {hasQueue && (
        <button onClick={onCancelQueue} className="btn btn-danger">
          ⏹ Cancel & Clear Queue
        </button>
      )}
      {hasResults && (
        <button
          onClick={onClearAllResults}
          className="btn btn-secondary"
        >
          X Clear All Results
        </button>
      )}
    </div>
  );
};
