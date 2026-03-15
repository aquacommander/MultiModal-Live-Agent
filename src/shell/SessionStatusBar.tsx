import React from 'react';
import { WorkflowStage } from '../shared/types/workflow.types';

interface SessionStatusBarProps {
  stage: WorkflowStage;
  taskCount: number;
  autoRouteEnabled: boolean;
  liveConnected: boolean;
  liveRecording: boolean;
}

export const SessionStatusBar: React.FC<SessionStatusBarProps> = ({
  stage,
  taskCount,
  autoRouteEnabled,
  liveConnected,
  liveRecording,
}) => {
  return (
    <div className="status-bar">
      <span>Stage: {stage}</span>
      <span>Tasks: {taskCount}</span>
      <span>Voice Auto-route: {autoRouteEnabled ? 'ON' : 'OFF'}</span>
      <span>Live Session: {liveConnected ? 'Connected' : 'Disconnected'}</span>
      <span>Mic: {liveRecording ? 'Recording' : 'Idle'}</span>
      <span>Model Stack: Gemini Live + Gemini Image/Video</span>
      <span>Cloud: Google Cloud (integration-ready)</span>
    </div>
  );
};
