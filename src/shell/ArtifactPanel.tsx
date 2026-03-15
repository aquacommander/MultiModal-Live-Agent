import React from 'react';
import { Artifact } from '../shared/types/artifact.types';

interface ArtifactPanelProps {
  artifacts: Artifact[];
  rightContent?: React.ReactNode;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifacts, rightContent }) => {
  return (
    <div className="shell-card">
      <h2>Creative Storyteller</h2>
      {rightContent}
      <h3>Artifacts</h3>
      <ul className="list">
        {artifacts.length === 0 && <li className="muted">No artifacts yet.</li>}
        {artifacts.map((artifact) => (
          <li key={artifact.id}>
            <strong>{artifact.kind}</strong> - {artifact.producer}
            <div className="muted">{new Date(artifact.createdAt).toLocaleTimeString()}</div>
            {artifact.kind === 'status-update' && (
              <div className="muted">{(artifact.payload as any)?.message}</div>
            )}
            {artifact.kind === 'image' && (
              <>
                <a
                  className="muted"
                  href={(artifact.payload as any)?.imageDataUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open image
                </a>
                {(artifact.payload as any)?.cloud?.persistedUrl && (
                  <a
                    className="muted"
                    href={(artifact.payload as any)?.cloud?.persistedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open cloud image
                  </a>
                )}
                {(artifact.payload as any)?.cloud?.message && (
                  <div className="muted">{(artifact.payload as any)?.cloud?.message}</div>
                )}
              </>
            )}
            {artifact.kind === 'video' && (
              <>
                <a
                  className="muted"
                  href={(artifact.payload as any)?.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open video
                </a>
                {(artifact.payload as any)?.cloud?.persistedUrl && (
                  <a
                    className="muted"
                    href={(artifact.payload as any)?.cloud?.persistedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open cloud video
                  </a>
                )}
                {(artifact.payload as any)?.cloud?.message && (
                  <div className="muted">{(artifact.payload as any)?.cloud?.message}</div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
