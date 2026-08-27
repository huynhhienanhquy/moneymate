import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';

export const useLoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.dataset.field || event.target.name;
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.password) return setError('Vui lòng điền đầy đủ thông tin.');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { ...form, email: form.email.trim().toLowerCase(), platform: 'web' });
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
