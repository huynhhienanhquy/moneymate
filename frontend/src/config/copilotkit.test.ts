import { buildCopilotKitRuntimeUrl, parseCopilotKitEnabled } from './copilotkit';

describe('CopilotKit frontend config', () => {
  it('keeps the frontend feature disabled by default', () => {
    expect(parseCopilotKitEnabled(undefined)).toBe(false);
    expect(parseCopilotKitEnabled(' false ')).toBe(false);
  });

  it('accepts an explicit true value and rejects invalid values', () => {
    expect(parseCopilotKitEnabled(' TRUE ')).toBe(true);
    expect(() => parseCopilotKitEnabled('yes')).toThrow(
      'VITE_COPILOTKIT_ENABLED must be either true or false',
    );
  });

  it('derives the single-route runtime URL from the API base URL', () => {
    expect(buildCopilotKitRuntimeUrl('http://localhost:5000/api/')).toBe(
      'http://localhost:5000/api/copilotkit',
    );
    expect(buildCopilotKitRuntimeUrl('/api')).toBe('/api/copilotkit');
    expect(() => buildCopilotKitRuntimeUrl('   ')).toThrow('VITE_API_URL must not be empty');
  });
});
