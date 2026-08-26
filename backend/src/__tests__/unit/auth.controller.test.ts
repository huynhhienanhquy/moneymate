import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';

jest.mock('../../services/auth.service');

const MockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

function createResponse() {
  const response = {
    locals: {},
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    status: jest.fn(),
    json: jest.fn()
  };
  response.status.mockReturnValue(response);
  return response;
}

describe('AuthController platform token transport', () => {
  beforeEach(() => {
    MockAuthService.mockClear();
  });

  it('returns the refresh token in the body for mobile login', async () => {
    const controller = new AuthController();
    const service = MockAuthService.mock.instances[0] as jest.Mocked<AuthService>;
    service.login.mockResolvedValue({
      user: { id: 'user-id', email: 'test@example.com', fullName: 'Test', avatarUrl: null, role: 'USER' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });
    const response = createResponse();

    await controller.login(
      { body: { email: 'test@example.com', password: 'password', platform: 'android', deviceId: 'device-id' } } as never,
      response as never,
      jest.fn()
    );

    expect(service.login).toHaveBeenCalledWith('test@example.com', 'password', expect.objectContaining({
      platform: 'android',
      deviceId: 'device-id'
    }));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ refreshToken: 'refresh-token' })
    }));
  });

  it('does not expose the refresh token in a web login response body', async () => {
    const controller = new AuthController();
    const service = MockAuthService.mock.instances[0] as jest.Mocked<AuthService>;
    service.login.mockResolvedValue({
      user: { id: 'user-id', email: 'test@example.com', fullName: 'Test', avatarUrl: null, role: 'USER' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });
    const response = createResponse();

    await controller.login(
      { body: { email: 'test@example.com', password: 'password', platform: 'web' } } as never,
      response as never,
      jest.fn()
    );

    const payload = response.json.mock.calls[0][0];
    expect(payload.data.refreshToken).toBeUndefined();
    expect(response.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
  });

  it('returns a rotated body token when refresh uses body transport', async () => {
    const controller = new AuthController();
    const service = MockAuthService.mock.instances[0] as jest.Mocked<AuthService>;
    service.refresh.mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    const response = createResponse();

    await controller.refresh(
      { cookies: {}, body: { refreshToken: 'old-refresh' } } as never,
      response as never,
      jest.fn()
    );

    expect(service.refresh).toHaveBeenCalledWith('old-refresh');
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' }
    }));
  });
});
