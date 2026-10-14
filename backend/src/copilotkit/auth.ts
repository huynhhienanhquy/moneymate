import { AppError } from '../common/app-error';
import { AuthenticatedUser, getBearerToken, verifyAccessToken } from '../middlewares/auth';

/**
 * Build the unauthorized response returned when CopilotKit authentication fails.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's auth rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @param message - The human-readable outcome message returned to the caller.
 * @returns The resulting auth value for the caller.
 */
const unauthorizedResponse = (request: Request, message: string): Response => {
  const requestId = request.headers.get('x-request-id') || undefined;
  const headers = new Headers({ 'content-type': 'application/json' });
  if (requestId) headers.set('x-request-id', requestId);

  return new Response(JSON.stringify({
    success: false,
    code: 'UNAUTHORIZED',
    message,
    errors: [],
    ...(requestId ? { requestId } : {}),
  }), { status: 401, headers });
};

/**
 * Resolve copilot user from the available auth context.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's auth rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @returns A promise containing the resulting auth value.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export const resolveCopilotUser = async (request: Request): Promise<AuthenticatedUser> => {
  const token = getBearerToken(request.headers.get('authorization'));
  if (!token) {
    throw unauthorizedResponse(request, 'Authentication token is missing');
  }

  try {
    return await verifyAccessToken(token);
  } catch (error) {
    const message = error instanceof AppError
      ? error.message
      : 'Invalid or expired authentication token';
    throw unauthorizedResponse(request, message);
  }
};
