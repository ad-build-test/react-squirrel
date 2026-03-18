/**
 * API configuration for squirrel-backend
 *
 * In dev mode, Vite proxy forwards /v1/* to http://localhost:8080.
 * In production (Tauri), config.json is read at startup to determine the backend URL.
 * Falls back to VITE_API_URL env var if config.json is not available.
 */

let runtimeBaseURL: string | null = null;

/**
 * Load runtime configuration from config.json via Tauri FS API.
 * Must be called before the app renders. No-ops in non-Tauri environments.
 */
export async function loadRuntimeConfig(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
  if (!(window as any).__TAURI__) return;

  try {
    const { resolveResource } = await import('@tauri-apps/api/path');
    const { readTextFile } = await import('@tauri-apps/api/fs');

    const configPath = await resolveResource('config.json');
    const text = await readTextFile(configPath);
    const config = JSON.parse(text);
    if (config.apiUrl) {
      runtimeBaseURL = config.apiUrl;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not load config.json, using build-time fallback');
  }
}

export const API_CONFIG = {
  get baseURL(): string {
    return runtimeBaseURL || import.meta.env.VITE_API_URL || '';
  },
  endpoints: {
    snapshots: '/v1/snapshots',
    pvs: '/v1/pvs',
    tags: '/v1/tags',
    jobs: '/v1/jobs',
  },
  timeout: 30000, // 30 seconds
};

/**
 * Derive a WebSocket URL from the configured base URL, or fall back to
 * the current page host (for Vite proxy in dev mode).
 */
export function getWebSocketURL(path: string): string {
  if (API_CONFIG.baseURL) {
    const url = new URL(API_CONFIG.baseURL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}${path}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

/**
 * Generic API response wrapper from squirrel-backend
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
