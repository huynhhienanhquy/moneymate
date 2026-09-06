import { act } from 'react';
import { render, screen } from '@/test/render';
import { getCopilotErrorMessage, MoneyMateCopilotProvider } from './MoneyMateCopilotProvider';
vi.mock('@/components/MoneyMateCopilot/ExpenseTool', () => ({ ExpenseTool: () => <div data-testid="expense-tool" /> }));

const copilotMocks = vi.hoisted(() => ({
  providerProps: [] as Array<Record<string, unknown>>,
  agentContext: vi.fn(),
  suggestions: vi.fn(),
}));

const authMocks = vi.hoisted(() => {
  type AuthSnapshot = {
    accessToken: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
  };

  let state: AuthSnapshot = {
    accessToken: null,
    isAuthenticated: false,
    isInitializing: true,
  };
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (partial: Partial<AuthSnapshot>) => {
      state = { ...state, ...partial };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

vi.mock('@copilotkit/react-core/v2', () => ({
  CopilotKit: ({ children, ...props }: { children: React.ReactNode }) => {
    copilotMocks.providerProps.push(props);
    return <div data-testid="copilot-provider">{children}</div>;
  },
  useAgentContext: copilotMocks.agentContext,
  useConfigureSuggestions: copilotMocks.suggestions,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/budgets' }),
}));

vi.mock('@/stores/auth.store', async () => {
  const { useSyncExternalStore } = await vi.importActual<typeof import('react')>('react');
  const useAuthStore = Object.assign(
    <T,>(selector: (state: ReturnType<typeof authMocks.getState>) => T) =>
      useSyncExternalStore(
        authMocks.subscribe,
        () => selector(authMocks.getState()),
        () => selector(authMocks.getState()),
      ),
    { getState: authMocks.getState },
  );

  return { useAuthStore };
});

vi.mock('@/stores/theme.store', () => ({
  useThemeStore: (selector: (state: { theme: 'dark' }) => unknown) => selector({ theme: 'dark' }),
}));

describe('MoneyMateCopilotProvider', () => {
  it('explains exhausted API credit without exposing provider error details', () => {
    const message = getCopilotErrorMessage({
      error: { code: 'RUN_ERROR', message: 'Failed after 2 attempts. Last error: You have no credits remaining.' },
      context: { source: 'agent' },
    } as Parameters<typeof getCopilotErrorMessage>[0]);
    expect(message).toContain('tài khoản API đã hết credit');
    expect(message).not.toContain('Failed after');
  });
  beforeEach(() => {
    copilotMocks.providerProps.length = 0;
    copilotMocks.agentContext.mockClear();
    copilotMocks.suggestions.mockClear();
    authMocks.setState({
      accessToken: null,
      isAuthenticated: false,
      isInitializing: true,
    });
  });

  it('does not mount CopilotKit while disabled or while auth is initializing', () => {
    render(
      <MoneyMateCopilotProvider enabled={false}>
        <span>fallback child</span>
      </MoneyMateCopilotProvider>,
    );
    expect(screen.getByText('fallback child')).toBeInTheDocument();
    expect(screen.queryByTestId('copilot-provider')).not.toBeInTheDocument();
    expect(copilotMocks.providerProps).toHaveLength(0);

    render(
      <MoneyMateCopilotProvider enabled runtimeUrl="/api/copilotkit">
        <span>waiting child</span>
      </MoneyMateCopilotProvider>,
    );
    expect(screen.getByText('waiting child')).toBeInTheDocument();
    expect(screen.queryByTestId('copilot-provider')).not.toBeInTheDocument();
  });

  it('mounts with the current bearer token and only safe UI context', () => {
    authMocks.setState({
      accessToken: 'token-a',
      isAuthenticated: true,
      isInitializing: false,
    });

    render(
      <MoneyMateCopilotProvider enabled runtimeUrl="/api/copilotkit">
        <span>authenticated child</span>
      </MoneyMateCopilotProvider>,
    );

    expect(screen.getByTestId('copilot-provider')).toBeInTheDocument();
    const props = copilotMocks.providerProps[copilotMocks.providerProps.length - 1]!;
    expect(props.runtimeUrl).toBe('/api/copilotkit');
    expect(props.credentials).toBe('include');
    expect(props.useSingleEndpoint).toBe(true);
    expect((props.headers as () => Record<string, string>)()).toEqual({
      Authorization: 'Bearer token-a',
    });
    expect(copilotMocks.agentContext).toHaveBeenCalledWith({
      description: expect.any(String),
      value: {
        route: '/budgets',
        screenName: 'Ngân sách',
        theme: 'dark',
        locale: 'vi-VN',
        localDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        timeZone: expect.any(String),
      },
    });
    expect(JSON.stringify(copilotMocks.agentContext.mock.calls)).not.toContain('token-a');

    const suggestionConfig = copilotMocks.suggestions.mock.calls[0][0];
    expect(suggestionConfig.consumerAgentId).toBe('default');
    expect(suggestionConfig.available).toBe('before-first-message');
    expect(suggestionConfig.suggestions).toHaveLength(6);
    expect(screen.getByTestId('expense-tool')).toBeInTheDocument();
    expect(suggestionConfig.suggestions.map((item: { message: string }) => item.message)).toContain(
      'Tháng này tôi chi nhiều nhất ở đâu?',
    );
  });

  it('uses a refreshed token and unmounts on logout', () => {
    authMocks.setState({
      accessToken: 'token-a',
      isAuthenticated: true,
      isInitializing: false,
    });
    render(
      <MoneyMateCopilotProvider enabled runtimeUrl="/api/copilotkit">
        <span>child</span>
      </MoneyMateCopilotProvider>,
    );

    act(() => authMocks.setState({ accessToken: 'token-b' }));
    const refreshedProps = copilotMocks.providerProps[copilotMocks.providerProps.length - 1]!;
    expect((refreshedProps.headers as () => Record<string, string>)()).toEqual({
      Authorization: 'Bearer token-b',
    });

    act(() => authMocks.setState({ accessToken: null, isAuthenticated: false }));
    expect(screen.queryByTestId('copilot-provider')).not.toBeInTheDocument();
  });
});
