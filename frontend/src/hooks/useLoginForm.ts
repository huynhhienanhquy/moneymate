import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { runAuthSessionTransition } from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Provide login form state and actions to React consumers.
 *
 * Use it in React components that need use login form behavior.
 * @returns The current login form state and the actions that operate on it.
 */
export const useLoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Change for use login form.
   *
   * Use it in React components that need use login form behavior.
   * @param event - The UI or runtime event that initiated the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.dataset.field || event.target.name;
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setError('');
  };

  /**
   * Submit the current use login form form.
   *
   * Use it in React components that need use login form behavior.
   * @param event - The UI or runtime event that initiated the operation.
   * @returns A promise containing the resulting use login form value.
   */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.password) return setError('Vui lòng điền đầy đủ thông tin.');
    setLoading(true);
    try {
      const response = await runAuthSessionTransition(() => api.post('/auth/login', { ...form, email: form.email.trim().toLowerCase(), platform: 'web' }));
      const { user, accessToken } = response.data.data;
      login(user, accessToken);
      navigate('/');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return { form, showPassword, setShowPassword, loading, error, change, submit };
};
