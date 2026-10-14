export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null | Promise<string | null>;
  refreshSession: () => Promise<string>;
  onUnauthorized: () => void | Promise<void>;
}

export interface ApiRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export type ApiTransport = <T>(request: ApiRequest, accessToken: string | null) => Promise<T>;

/**
 * Create api client for the api core workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param options - Settings that customize how the operation runs.
 * @param transport - The transport value required by the operation.
 * @returns The resulting api core value for the caller.
 */
export function createApiClient(options: ApiClientOptions, transport: ApiTransport) {
  return async function request<T>(input: ApiRequest): Promise<T> {
    const token = await options.getAccessToken();
    try {
      return await transport<T>(input, token);
    } catch (error) {
      if (!(error instanceof ApiUnauthorizedError)) throw error;
      try {
        const refreshedToken = await options.refreshSession();
        return await transport<T>(input, refreshedToken);
      } catch (refreshError) {
        await options.onUnauthorized();
        throw refreshError;
      }
    }
  };
}

export class ApiUnauthorizedError extends Error {
  /**
   * Initialize a api core instance with its required dependencies.
   *
   * Use it from callers that need this operation without duplicating its rules.
   */
  constructor() {
    super('Unauthorized');
    this.name = 'ApiUnauthorizedError';
  }
}
