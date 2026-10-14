import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api/client';

/**
 * Provide register form state and actions to React consumers.
 *
 * Use it in React components that need use register form behavior.
 * @returns The current register form state and the actions that operate on it.
 */
export const useRegisterForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Change for use register form.
   *
   * Use it in React components that need use register form behavior.
   * @param event - The UI or runtime event that initiated the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError('');
  };

  /**
   * Submit the current use register form form.
   *
   * Use it in React components that need use register form behavior.
   * @param event - The UI or runtime event that initiated the operation.
   * @returns A promise containing the resulting use register form value.
   */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) return setError('Vui lòng điền đầy đủ thông tin.');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
    if (form.password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    setLoading(true);
    try {
      await api.post('/auth/register', { fullName: form.fullName, email: form.email.trim().toLowerCase(), password: form.password });
      setSuccess(true);
      window.setTimeout(() => navigate('/login'), 2000);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return { form, showPassword, setShowPassword, loading, error, success, change, submit };
};
