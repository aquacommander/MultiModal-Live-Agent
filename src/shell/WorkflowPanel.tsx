import React, { useState } from 'react';
import { WorkflowStage, WorkflowTask } from '../shared/types/workflow.types';

interface WorkflowPanelProps {
  stage: WorkflowStage;
  tasks: WorkflowTask[];
  onRouteRequest: (goal: string) => void;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ stage, tasks, onRouteRequest }) => {
  const [goal, setGoal] = useState('');

  return (
    <div className="shell-card">
      <h2>Workflow</h2>
      <p className="muted">Current stage: {stage}</p>
      <div className="workflow-composer">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Type a mission request (ex: Create a cinematic teaser image and video)"
        />
        <button
          type="button"
          onClick={() => {
            if (!goal.trim()) return;
            onRouteRequest(goal.trim());
          }}
          disabled={!goal.trim()}
        >
          Route Mission
        </button>
      </div>
      <ul className="list">
        {tasks.length === 0 && <li className="muted">No active tasks.</li>}
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.agent}</strong> - {task.status}
            <div className="muted">{task.goal}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
