import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlRowView, ControlRowViewProps } from '../../src/components/ControlRowView';

describe('ControlRowView', () => {
  const defaultProps: ControlRowViewProps = {
    selectedTestsCount: 0,
    filteredTestsCount: 10,
    hasQueue: false,
    hasResults: false,
    onSelectAll: vi.fn(),
    onDeselectAll: vi.fn(),
    onRunSelected: vi.fn(),
    onCancelQueue: vi.fn(),
    onClearAllResults: vi.fn(),
  };

  it('renders all basic buttons', () => {
    render(<ControlRowView {...defaultProps} />);
    
    expect(screen.getByText(/Select All \(10\)/)).toBeInTheDocument();
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
    expect(screen.getByText(/Run Selected \(0\)/)).toBeInTheDocument();
  });

  it('displays correct selected tests count', () => {
    render(<ControlRowView {...defaultProps} selectedTestsCount={5} />);
    
    expect(screen.getByText(/Run Selected \(5\)/)).toBeInTheDocument();
  });

  it('displays correct filtered tests count', () => {
    render(<ControlRowView {...defaultProps} filteredTestsCount={25} />);
    
    expect(screen.getByText(/Select All \(25\)/)).toBeInTheDocument();
  });

  it('disables Run Selected button when no tests are selected', () => {
    render(<ControlRowView {...defaultProps} selectedTestsCount={0} />);
    
    const runButton = screen.getByText(/Run Selected/);
    expect(runButton).toBeDisabled();
  });

  it('enables Run Selected button when tests are selected', () => {
    render(<ControlRowView {...defaultProps} selectedTestsCount={3} />);
    
    const runButton = screen.getByText(/Run Selected/);
    expect(runButton).not.toBeDisabled();
  });

  it('calls onSelectAll when Select All is clicked', async () => {
    const user = userEvent.setup();
    const onSelectAll = vi.fn();
    
    render(<ControlRowView {...defaultProps} onSelectAll={onSelectAll} />);
    
    await user.click(screen.getByText(/Select All/));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDeselectAll when Deselect All is clicked', async () => {
    const user = userEvent.setup();
    const onDeselectAll = vi.fn();
    
    render(<ControlRowView {...defaultProps} onDeselectAll={onDeselectAll} />);
    
    await user.click(screen.getByText('Deselect All'));
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onRunSelected when Run Selected is clicked', async () => {
    const user = userEvent.setup();
    const onRunSelected = vi.fn();
    
    render(<ControlRowView {...defaultProps} selectedTestsCount={2} onRunSelected={onRunSelected} />);
    
    await user.click(screen.getByText(/Run Selected/));
    expect(onRunSelected).toHaveBeenCalledTimes(1);
  });

  it('shows Cancel & Clear Queue button when hasQueue is true', () => {
    render(<ControlRowView {...defaultProps} hasQueue={true} />);
    
    expect(screen.getByText(/Cancel & Clear Queue/)).toBeInTheDocument();
  });

  it('hides Cancel & Clear Queue button when hasQueue is false', () => {
    render(<ControlRowView {...defaultProps} hasQueue={false} />);
    
    expect(screen.queryByText(/Cancel & Clear Queue/)).not.toBeInTheDocument();
  });

  it('calls onCancelQueue when Cancel & Clear Queue is clicked', async () => {
    const user = userEvent.setup();
    const onCancelQueue = vi.fn();
    
    render(<ControlRowView {...defaultProps} hasQueue={true} onCancelQueue={onCancelQueue} />);
    
    await user.click(screen.getByText(/Cancel & Clear Queue/));
    expect(onCancelQueue).toHaveBeenCalledTimes(1);
  });

  it('shows Clear All Results button when hasResults is true', () => {
    render(<ControlRowView {...defaultProps} hasResults={true} />);
    
    expect(screen.getByText(/Clear All Results/)).toBeInTheDocument();
  });

  it('hides Clear All Results button when hasResults is false', () => {
    render(<ControlRowView {...defaultProps} hasResults={false} />);
    
    expect(screen.queryByText(/Clear All Results/)).not.toBeInTheDocument();
  });

  it('calls onClearAllResults when Clear All Results is clicked', async () => {
    const user = userEvent.setup();
    const onClearAllResults = vi.fn();
    
    render(<ControlRowView {...defaultProps} hasResults={true} onClearAllResults={onClearAllResults} />);
    
    await user.click(screen.getByText(/Clear All Results/));
    expect(onClearAllResults).toHaveBeenCalledTimes(1);
  });

  it('shows both queue and results buttons when both are true', () => {
    render(<ControlRowView {...defaultProps} hasQueue={true} hasResults={true} />);
    
    expect(screen.getByText(/Cancel & Clear Queue/)).toBeInTheDocument();
    expect(screen.getByText(/Clear All Results/)).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    const { container } = render(<ControlRowView {...defaultProps} />);
    
    expect(container.firstChild).toHaveClass('control-row');
  });

  it('renders with all buttons when fully populated', () => {
    render(
      <ControlRowView
        selectedTestsCount={5}
        filteredTestsCount={20}
        hasQueue={true}
        hasResults={true}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        onRunSelected={vi.fn()}
        onCancelQueue={vi.fn()}
        onClearAllResults={vi.fn()}
      />
    );
    
    // Should have 5 buttons: Select All, Deselect All, Run Selected, Cancel Queue, Clear Results
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });
});
