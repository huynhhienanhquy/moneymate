import { useQuery } from '@tanstack/react-query';
import api from '@/services/api/client';

export const useWallets = () => useQuery({
  queryKey: ['wallets'],
  queryFn: () => api.get('/wallets').then((response) => response.data.data),
});

export const useCategories = () => useQuery({
  queryKey: ['categories'],
  queryFn: () => api.get('/categories').then((response) => response.data.data),
});
