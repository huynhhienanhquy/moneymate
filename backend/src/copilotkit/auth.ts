import { AppError } from '../common/app-error';
import { AuthenticatedUser, getBearerToken, verifyAccessToken } from '../middlewares/auth';

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
