import { API_CONFIG } from '../config/api';
import { apiClient } from './apiClient';
import { ApiKeyCreateDTO, ApiKeyCreateResultDTO, ApiKeyDTO } from '../types';

export const apiKeyService = {
  /**
   * List all API Keys, optionally filtered by active status
   */
  async listAllKeys(activeOnly: boolean = false): Promise<ApiKeyDTO[]> {
    return apiClient.get<ApiKeyDTO[]>(API_CONFIG.endpoints.apiKeys, { active_only: activeOnly });
  },

  /**
   * Create a new API Key
   */
  async createApiKey(data: ApiKeyCreateDTO): Promise<ApiKeyCreateResultDTO> {
    return apiClient.post<ApiKeyCreateResultDTO>(API_CONFIG.endpoints.apiKeys, data);
  },

  /**
   * Deactivate an API Key by ID
   */
  async deactivateApiKey(keyId: string): Promise<ApiKeyDTO> {
    return apiClient.delete<ApiKeyDTO>(`${API_CONFIG.endpoints.apiKeys}/${keyId}`);
  },

  /**
   * Bootstrap an initial API Key (only allowed when no keys exist)
   */
  async bootstrapApiKey(): Promise<ApiKeyCreateResultDTO> {
    return apiClient.post<ApiKeyCreateResultDTO>(`${API_CONFIG.endpoints.apiKeys}/bootstrap`, {});
  },

  /**
   * Get the current number of API Keys
   */
  async getApiKeyCount(activeOnly: boolean = false): Promise<number> {
    return apiClient.get<number>(`${API_CONFIG.endpoints.apiKeys}/count`, {
      active_only: activeOnly,
    });
  },
};
