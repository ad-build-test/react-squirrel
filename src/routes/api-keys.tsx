import { useState, useCallback, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAdminMode } from '../contexts/AdminModeContext';
import { ApiKeysPage } from '../pages';
import { apiKeyService } from '../services/apiKeyService';
import { ApiKeyDTO } from '../types';

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeyDTO[]>([]);
  const { isAdminMode } = useAdminMode();
  const navigate = useNavigate();

  const fetchApiKeys = useCallback(async () => {
    const keys = await apiKeyService.listAllKeys();
    setApiKeys(keys);
    console.log('Fetched API Keys:', keys);
  }, []);

  useEffect(() => {
    if (!isAdminMode) {
      navigate({ to: '/snapshots' });
    }
  }, [isAdminMode, navigate]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  if (!isAdminMode) return null;

  return <ApiKeysPage apiKeys={apiKeys} />;
}

export const Route = createFileRoute('/api-keys')({
  component: ApiKeys,
});
