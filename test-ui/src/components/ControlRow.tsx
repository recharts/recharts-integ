import React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  selectAllTests,
  deselectAllTests,
  clearAllResults,
} from "../store/testsSlice";
import {
  selectSelectedTests,
  selectHasQueue,
  selectHasResults,
} from "../store/controlSelectors";
import { ControlRowView } from "./ControlRowView";
import { Test } from "../types";

interface BasicControlRowProps {
  children: React.ReactNode;
  className?: string;
}

// Basic container component for other control rows
export const ControlRowContainer: React.FC<BasicControlRowProps> = ({
  children,
  className = "",
}) => {
  const classes = className ? `control-row ${className}` : "control-row";

  return <div className={classes}>{children}</div>;
};

interface ControlRowProps {
  filteredTests: Test[];
  onRunSelected: () => void;
  onCancelQueue: () => void;
}

// Connected component for the main control row with buttons
export const ControlRow: React.FC<ControlRowProps> = ({
  filteredTests,
  onRunSelected,
  onCancelQueue,
}) => {
  const dispatch = useAppDispatch();
  const selectedTests = useAppSelector(selectSelectedTests);
  const hasQueue = useAppSelector(selectHasQueue);
  const hasResults = useAppSelector(selectHasResults);

  const handleSelectAll = () => {
    dispatch(selectAllTests(filteredTests));
  };

  const handleDeselectAll = () => {
    dispatch(deselectAllTests());
  };

  const handleClearAllResults = () => {
    dispatch(clearAllResults());
    sessionStorage.removeItem("testResults");
  };

  return (
    <ControlRowView
      selectedTestsCount={selectedTests.length}
      filteredTestsCount={filteredTests.length}
      hasQueue={hasQueue}
      hasResults={hasResults}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleDeselectAll}
      onRunSelected={onRunSelected}
      onCancelQueue={onCancelQueue}
      onClearAllResults={handleClearAllResults}
    />
  );
};
