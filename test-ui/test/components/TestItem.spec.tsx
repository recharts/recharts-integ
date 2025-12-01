import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestItem } from "../../src/components/TestItem";
import { Test, PhaseName } from "../../src/types";

const mockTest: Test = {
  name: "test-example",
  stable: true,
  description: "Test description",
  type: "library",
  packageManager: "npm",
  dependencies: { react: "18" },
};

const mockEstimatedDurations: Record<PhaseName, number> = {
  clean: 1000,
  setVersion: 2000,
  install: 5000,
  test: 3000,
  build: 4000,
  verify: 1000,
};

describe("TestItem", () => {
  it("should render test name and stable badge", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={null}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    expect(screen.getByText("test-example")).toBeInTheDocument();
    expect(screen.getByText("✓ Stable")).toBeInTheDocument();
  });

  it("should render experimental badge for unstable tests", () => {
    const experimentalTest: Test = { ...mockTest, stable: false };
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={experimentalTest}
        status={null}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    expect(screen.getByText("⚠ Experimental")).toBeInTheDocument();
  });

  it("should render test description when provided", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={null}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    expect(screen.getByTitle("Test description")).toBeInTheDocument();
  });

  it("should call onToggleSelection when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={null}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(onToggleSelection).toHaveBeenCalledTimes(1);
  });

  it("should call onRun when Run button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={null}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    const runButton = screen.getByRole("button", { name: /run/i });
    await user.click(runButton);

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("should disable checkbox when test is running", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={{
          id: "test-1",
          status: "running",
          currentPhase: "install",
          output: "",
          error: "",
        }}
        isSelected={false}
        isRunning={true}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("should disable checkbox when test is queued", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={{ id: "test-1", position: 2 }}
        isSelected={false}
        isRunning={false}
        isQueued={true}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("should show selected state when isSelected is true", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    const { container } = render(
      <TestItem
        test={mockTest}
        status={null}
        isSelected={true}
        isRunning={false}
        isQueued={false}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    expect(container.querySelector(".test-item.selected")).toBeInTheDocument();
  });

  it("should show queued status with position", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={{ id: "test-1", status: "queued", position: 3 }}
        isSelected={false}
        isRunning={false}
        isQueued={true}
        hasResult={false}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    expect(screen.getByText(/Queued \(#3\)/)).toBeInTheDocument();
  });

  it("should render Clear Result button for completed tests", () => {
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={{ id: "test-1", status: "passed", output: "", error: "" }}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={true}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    expect(
      screen.getByRole("button", { name: /clear result/i }),
    ).toBeInTheDocument();
  });

  it("should call onClearResult when Clear Result button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleSelection = vi.fn();
    const onRun = vi.fn();
    const onClearResult = vi.fn();

    render(
      <TestItem
        test={mockTest}
        status={{ id: "test-1", status: "passed", output: "", error: "" }}
        isSelected={false}
        isRunning={false}
        isQueued={false}
        hasResult={true}
        onToggleSelection={onToggleSelection}
        onRun={onRun}
        onClearResult={onClearResult}
        estimatedPhaseDurations={mockEstimatedDurations}
      />,
    );

    const clearButton = screen.getByRole("button", { name: /clear result/i });
    await user.click(clearButton);

    expect(onClearResult).toHaveBeenCalledTimes(1);
  });
});
