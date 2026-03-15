import React from 'react';
import { WorkflowStage } from '../shared/types/workflow.types';

interface SessionStatusBarProps {
  stage: WorkflowStage;
  taskCount: number;
}

export const SessionStatusBar: React.FC<SessionStatusBarProps> = ({ stage, taskCount }) => {
  return (
    <div className="status-bar">
      <span>Stage: {stage}</span>
      <span>Tasks: {taskCount}</span>
      <span>Model Stack: Gemini Live + Gemini Image/Video</span>
      <span>Cloud: Google Cloud (integration-ready)</span>
    </div>
  );
};
