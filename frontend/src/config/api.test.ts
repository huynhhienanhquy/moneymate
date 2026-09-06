import { resolveApiBaseUrl } from './api';

describe('API base URL', () => {
  it.each(['http://localhost:5000/api', 'http://127.0.0.1:5000/api/', 'http://[::1]:5000/api'])(
    'uses the same-origin dev proxy for %s so reload sends the login cookie',
    (url) => expect(resolveApiBaseUrl(url, true)).toBe('/api'),
  );

  it('preserves production and external API configuration', () => {
    expect(resolveApiBaseUrl('http://localhost:5000/api', false)).toBe('http://localhost:5000/api');
    expect(resolveApiBaseUrl('https://api.example.com/api', true)).toBe('https://api.example.com/api');
    expect(resolveApiBaseUrl(undefined, true)).toBe('/api');
    expect(resolveApiBaseUrl('/api', true)).toBe('/api');
  });
});
