import React, { useMemo, useRef } from 'react';
import { OrbShellLayout } from './shell/OrbShellLayout';
import { ArtifactPanel } from './shell/ArtifactPanel';
import { WorkflowPanel } from './shell/WorkflowPanel';
import { SessionStatusBar } from './shell/SessionStatusBar';
import {
  StorytellerWorkspace,
  StorytellerWorkspaceHandle,
} from './modules/creative-storyteller/components/StorytellerWorkspace';
import { useWorkflowCoordinator } from './orchestration/workflowCoordinator';
import './modules/live-agent/components/live-audio';
import { routeAgentTask } from './orchestration/agentRouter';
import { createTask } from './orchestration/taskDistributor';

const App: React.FC = () => {
  const workflow = useWorkflowCoordinator();
  const storytellerRef = useRef<StorytellerWorkspaceHandle>(null);

  const handleRouteRequest = async (goal: string) => {
    const decision = routeAgentTask(goal);
    const liveTask = createTask('live-agent', goal);
    workflow.onTaskStateChange({ ...liveTask, status: 'running' });

    if (decision.secondary === 'creative-storyteller') {
      const creativeTask = createTask('creative-storyteller', goal);
      workflow.onTaskStateChange({ ...creativeTask, status: 'queued' });
      await storytellerRef.current?.generateFromPrompt(goal);
      workflow.onTaskStateChange({ ...liveTask, status: 'completed' });
      return;
    }

    workflow.onArtifactCreated({
      id: `artifact-status-${Date.now()}`,
      kind: 'status-update',
      producer: 'orchestrator',
      payload: {
        message: `Live Agent handled request: ${decision.reason}`,
        goal,
      },
      createdAt: new Date().toISOString(),
    });
    workflow.onTaskStateChange({ ...liveTask, status: 'completed' });
  };

  const artifactPanel = useMemo(
    () => (
      <ArtifactPanel
        artifacts={workflow.artifacts}
        rightContent={
          <StorytellerWorkspace
            ref={storytellerRef}
            onTaskStateChange={workflow.onTaskStateChange}
            onArtifactCreated={workflow.onArtifactCreated}
          />
        }
      />
    ),
    [workflow.artifacts, workflow.onArtifactCreated, workflow.onTaskStateChange],
  );

  return (
    <div className="app-root">
      <OrbShellLayout
        left={
          <WorkflowPanel
            stage={workflow.stage}
            tasks={workflow.tasks}
            onRouteRequest={handleRouteRequest}
          />
        }
        center={<gdm-live-audio />}
        right={artifactPanel}
        bottom={<SessionStatusBar stage={workflow.stage} taskCount={workflow.tasks.length} />}
      />
    </div>
  );
};

export default App;
