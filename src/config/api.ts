/**
 * API configuration for score-backend
 * Based on configuration from superscore/squirrel-local.cfg
 *
 * In dev mode, Vite proxy forwards /v1/* to http://localhost:8080.
 * In production (Tauri), VITE_API_URL is set at build time per facility.
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '',
  endpoints: {
    snapshots: '/v1/snapshots',
    pvs: '/v1/pvs',
    tags: '/v1/tags',
    jobs: '/v1/jobs',
  },
  timeout: 30000, // 30 seconds
};

/**
 * Generic API response wrapper from score-backend
 */
export interface ApiResultResponse<T> {
  errorCode: number;
  errorMessage: string | null;
  payload: T;
}

/**
 * Paged result wrapper for paginated endpoints
 */
export interface PagedResultDTO<T> {
  results: T[];
  continuationToken?: string;
  totalCount?: number;
}
