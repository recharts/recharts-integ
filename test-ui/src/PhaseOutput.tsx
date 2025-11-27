import { useState, useEffect } from 'react';
import {Phases, PhaseName, Phase} from './types';
import './PhaseOutput.css';

const PHASE_NAMES: Record<PhaseName, string> = {
  clean: 'Clean',
  setVersion: 'Set Recharts Version',
  install: 'Install Dependencies',
  test: 'Run Tests',
  build: 'Build',
  verify: 'Verify Dependencies'
};

const PHASE_ORDER: PhaseName[] = ['clean', 'setVersion', 'install', 'test', 'build', 'verify'];

interface PhaseOutputProps {
  phases: Phases;
  currentPhase?: PhaseName | null;
}

function PhaseOutput({ phases, currentPhase }: PhaseOutputProps) {
  const [expandedPhases, setExpandedPhases] = useState(
    () => currentPhase ? { [currentPhase]: true } : {}
  );

  const togglePhase = (phaseName: keyof Phases) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseName]: !prev[phaseName]
    }));
  };

  const getPhaseIcon = (status: Phase['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'pending': return '⏸️';
      default: return '○';
    }
  };

  const formatDuration = (duration:Phase['duration']) => {
    if (!duration) return '-';
    const seconds = Math.floor(duration / 1000);
    const ms = duration % 1000;
    if (seconds > 0) {
      return `${seconds}.${Math.floor(ms / 100)}s`;
    }
    return `${ms}ms`;
  };

  // Auto-expand current phase
  useEffect(() => {
    if (currentPhase && !expandedPhases[currentPhase]) {
      setExpandedPhases(prev => ({
        ...prev,
        [currentPhase]: true
      }));
    }
  }, [currentPhase, expandedPhases]);

  return (
    <div className="phase-output">
      {PHASE_ORDER.map(phaseName => {
        const phase = phases[phaseName];
        if (!phase) return null;

        const isExpanded = expandedPhases[phaseName];
        const isCurrent = phaseName === currentPhase;
        const hasOutput = phase.output && phase.output.trim().length > 0;

        return (
          <div 
            key={phaseName} 
            className={`phase-section ${phase.status} ${isCurrent ? 'current' : ''}`}
          >
            <div 
              className="phase-header"
              onClick={() => hasOutput && togglePhase(phaseName)}
              style={{ cursor: hasOutput ? 'pointer' : 'default' }}
            >
              <span className="phase-icon">{getPhaseIcon(phase.status)}</span>
              <span className="phase-name">{PHASE_NAMES[phaseName]}</span>
              <span className="phase-duration">{formatDuration(phase.duration)}</span>
              {hasOutput && (
                <span className="phase-toggle">{isExpanded ? '▼' : '▶'}</span>
              )}
            </div>
            {isExpanded && hasOutput && (
              <div className="phase-output-content">
                <pre>{phase.output}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PhaseOutput;
