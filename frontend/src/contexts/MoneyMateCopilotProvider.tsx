import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  CopilotKit,
  useAgentContext,
  useConfigureSuggestions,
} from '@copilotkit/react-core/v2';
import {
  COPILOTKIT_FRONTEND_ENABLED,
  COPILOTKIT_RUNTIME_URL,
} from '@/config/copilotkit';
import { getCurrentPageName } from '@/helpers/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { ExpenseTool } from '@/components/MoneyMateCopilot/ExpenseTool';
import { AppControlTools } from '@/components/MoneyMateCopilot/AppControlTools';
import { toLocalDateInputValue } from '@/utils/dateInput';

type CopilotKitErrorEvent = Parameters<
  NonNullable<ComponentProps<typeof CopilotKit>['onError']>
>[0];

type CopilotMode = 'copilot' | 'fallback' | 'waiting';

interface MoneyMateCopilotStatus {
  mode: CopilotMode;
  errorMessage: string | null;
}

interface MoneyMateCopilotProviderProps {
  children: ReactNode;
  enabled?: boolean;
  runtimeUrl?: string;
}

const COPILOT_SUGGESTIONS = [
  { title: 'Ghi khoản chi', message: 'Hôm nay ăn uống hết 12 đ.' },
  {
    title: 'Chi tiêu nổi bật',
    message: 'Tháng này tôi chi nhiều nhất ở đâu?',
  },
  {
    title: 'Kiểm tra ngân sách',
    message: 'Tôi có vượt ngân sách không?',
  },
  {
    title: 'Tỷ lệ tiết kiệm',
    message: 'Tỷ lệ tiết kiệm của tôi thế nào?',
  },
  {
    title: 'So sánh theo tháng',
    message: 'So sánh chi tiêu với tháng trước.',
  },
  {
    title: 'Tiến độ mục tiêu',
    message: 'Mục tiêu tiết kiệm nào cần chú ý?',
  },
] as const;

const MoneyMateCopilotStatusContext = createContext<MoneyMateCopilotStatus>({
  mode: 'fallback',
  errorMessage: null,
});

export const getCopilotErrorMessage = (event: CopilotKitErrorEvent): string => {
  const eventError = event.error as { code?: unknown; message?: unknown } | undefined;
  const code = String(eventError?.code ?? '').toLowerCase();
  const detail = `${code} ${String(eventError?.message ?? '')}`.toLowerCase();
  const source = event.context.source;

  if (/insufficient_quota|credit_balance_exhausted|no credits remaining|exceeded your current quota/.test(detail)) {
    return 'MoneyMate AI chưa hoạt động vì tài khoản API đã hết credit. Vui lòng cập nhật thanh toán API rồi thử lại.';
  }
  if (/invalid_api_key|incorrect api key/.test(detail)) {
    return 'MoneyMate AI chưa kết nối được vì API key không hợp lệ. Vui lòng kiểm tra cấu hình máy chủ.';
  }
  if (code.includes('tool')) {
    return 'MoneyMate AI chưa thể đọc dữ liệu tài chính. Vui lòng thử lại.';
  }
  if (code.includes('agent') || source === 'agent') {
    return 'MoneyMate AI chưa thể xử lý yêu cầu này. Vui lòng thử lại.';
  }
  if (code.includes('runtime') || code.includes('connect') || code.includes('network') || source === 'network') {
    return 'Không thể kết nối MoneyMate AI. Vui lòng kiểm tra kết nối và thử lại.';
  }
  return 'MoneyMate AI đang gặp sự cố tạm thời. Vui lòng thử lại sau.';
};

const MoneyMateCopilotBindings = () => {
  const location = useLocation();
  const theme = useThemeStore((state) => state.theme);
  const [localDate, setLocalDate] = useState(() => toLocalDateInputValue());
  useEffect(() => {
    const timer = setInterval(() => setLocalDate(toLocalDateInputValue()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const appContext = useMemo(
    () => ({
      route: location.pathname,
      screenName: getCurrentPageName(location.pathname, false),
      theme,
      locale: 'vi-VN',
      localDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    [location.pathname, theme, localDate],
  );

  useAgentContext({
    description: 'Ngữ cảnh giao diện MoneyMate hiện tại; không dùng để xác thực người dùng.',
    value: appContext,
  });

  useConfigureSuggestions(
    {
      suggestions: [...COPILOT_SUGGESTIONS],
      available: 'before-first-message',
      consumerAgentId: 'default',
    },
    [],
  );

  return (
    <>
      <ExpenseTool />
      <AppControlTools />
    </>
  );
};

export const useMoneyMateCopilotStatus = () => useContext(MoneyMateCopilotStatusContext);

export const MoneyMateCopilotProvider = ({
  children,
  enabled = COPILOTKIT_FRONTEND_ENABLED,
  runtimeUrl = COPILOTKIT_RUNTIME_URL,
}: MoneyMateCopilotProviderProps) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headers = useCallback((): Record<string, string> => {
    const currentToken = useAuthStore.getState().accessToken;
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
  }, [accessToken]);

  const handleError = useCallback((event: CopilotKitErrorEvent) => {
    setErrorMessage(getCopilotErrorMessage(event));
    const eventError = event.error as { code?: unknown } | undefined;
    console.warn('MoneyMate CopilotKit error', {
      code: eventError?.code ?? 'UNKNOWN',
      source: event.context.source,
    });

    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorMessage(null), 8000);
  }, []);

  useEffect(() => () => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  if (!enabled || isInitializing || !isAuthenticated || !accessToken) {
    return (
      <MoneyMateCopilotStatusContext.Provider value={{ mode: enabled ? 'waiting' : 'fallback', errorMessage: null }}>
        {children}
      </MoneyMateCopilotStatusContext.Provider>
    );
  }

  return (
    <MoneyMateCopilotStatusContext.Provider value={{ mode: 'copilot', errorMessage }}>
      <CopilotKit
        runtimeUrl={runtimeUrl}
        headers={headers}
        credentials="include"
        useSingleEndpoint
        showDevConsole={false}
        enableInspector={false}
        onError={handleError}
      >
        <MoneyMateCopilotBindings />
        {children}
      </CopilotKit>
    </MoneyMateCopilotStatusContext.Provider>
  );
};

export default MoneyMateCopilotProvider;
