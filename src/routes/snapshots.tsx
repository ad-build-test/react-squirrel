import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SnapshotListPage } from '../pages';
import { Snapshot } from '../types';
import { useSnapshots, useDeleteSnapshot } from '../hooks';
import { useAdminMode } from '../contexts/AdminModeContext';

function Snapshots() {
  const navigate = useNavigate();
  const { isAdminMode } = useAdminMode();
  const { data: snapshots, isLoading, error } = useSnapshots();
  const deleteSnapshotMutation = useDeleteSnapshot();
  const [localSnapshots, setLocalSnapshots] = React.useState<Snapshot[]>([]);

  React.useEffect(() => {
    if (!snapshots) return;

    setLocalSnapshots(
      snapshots.map((snapshot) => ({
        uuid: snapshot.id,
        title: snapshot.title,
        description: snapshot.description || '',
        pvs: [],
        pvCount: snapshot.pvCount || 0,
        creation_time: new Date(snapshot.createdDate),
      }))
    );
  }, [snapshots]);

  const handleUpdateSnapshot = (updated: Snapshot) => {
    setLocalSnapshots((prev) => prev.map((s) => (s.uuid === updated.uuid ? updated : s)));
  };

  const handleSnapshotClick = (snapshot: Snapshot) => {
    navigate({ to: '/snapshot-details', search: { id: snapshot.uuid } });
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    await deleteSnapshotMutation.mutateAsync({ snapshotId });
  };

  if (isLoading) {
    return <div>Loading snapshots...</div>;
  }

  if (error) {
    return <div>Error: {error instanceof Error ? error.message : 'Failed to load snapshots'}</div>;
  }

  return (
    <SnapshotListPage
      snapshots={localSnapshots}
      onSnapshotClick={handleSnapshotClick}
      onUpdateSnapshot={handleUpdateSnapshot}
      onDeleteSnapshot={isAdminMode ? handleDeleteSnapshot : undefined}
      isAdmin={isAdminMode}
    />
  );
}

export const Route = createFileRoute('/snapshots')({
  component: Snapshots,
});
