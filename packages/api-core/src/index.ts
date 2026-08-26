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
  constructor() {
    super('Unauthorized');
    this.name = 'ApiUnauthorizedError';
  }
}
