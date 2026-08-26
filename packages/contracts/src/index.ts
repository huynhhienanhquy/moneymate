export type ClientPlatform = 'web' | 'ios' | 'android';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  platform?: ClientPlatform;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  timezone?: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse extends AuthTokensDto {
  user: UserDto;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: Array<{ field?: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
