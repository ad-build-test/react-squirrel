import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAdminMode } from '../contexts/AdminModeContext';

function ApiKeys() {
  const { isAdminMode } = useAdminMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminMode) {
      navigate({ to: '/snapshots' });
    }
  }, [isAdminMode, navigate]);

  if (!isAdminMode) return null;

  return <div>Hello /api-keys !</div>;
}

export const Route = createFileRoute('/api-keys')({
  component: ApiKeys,
});
