import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Button, Card, Field, Screen, StateMessage, ui } from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { enqueueMutation } from '@/storage/database';
import type { Category, Transaction, Wallet } from '@/types/api';
import { theme } from '@/theme';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { id, type: requestedType } = useLocalSearchParams<{ id?: string; type?: 'EXPENSE' | 'INCOME' }>();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: () => apiRequest<Wallet[]>('/wallets') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => apiRequest<Category[]>('/categories') });
  const existing = useQuery({ queryKey: ['transaction', id], queryFn: () => apiRequest<Transaction>(`/transactions/${id}`), enabled: !!id });
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [queued, setQueued] = useState(false);
  useEffect(() => { if (!id && (requestedType === 'INCOME' || requestedType === 'EXPENSE')) setType(requestedType); }, [id, requestedType]);
  useEffect(() => { if (existing.data) { const item = existing.data; setType(item.type === 'INCOME' ? 'INCOME' : 'EXPENSE'); setWalletId(item.walletId || item.wallet?.id || ''); setCategoryId(item.categoryId || item.category?.id || ''); setAmount(String(item.amount)); setNote(item.note || ''); } }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const idempotencyKey = Crypto.randomUUID();
      const body = JSON.stringify({ walletId, categoryId, amount: Number(amount), type, note: note || undefined, transactionDate: existing.data?.transactionDate || new Date().toISOString(), ...(id ? { version: existing.data?.version } : {}) });
      const method = id ? 'PUT' : 'POST'; const path = id ? `/transactions/${id}` : '/transactions';
      try {
        return await apiRequest(path, { method, headers: { 'Idempotency-Key': idempotencyKey }, body });
      } catch (error) {
        if (error instanceof ApiError && error.status < 500) throw error;
        await enqueueMutation(db, { id: idempotencyKey, method, path, body });
        setQueued(true);
        return null;
      }
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['transactions'] }); if (!queued) router.back(); }
  });

  const filteredCategories = categories.data?.filter((category) => category.type === type) || [];
  return <Screen title={id ? 'Sửa giao dịch' : 'Thêm giao dịch'}>
    <View style={ui.row}>{(['EXPENSE', 'INCOME'] as const).map((value) => <Pressable key={value} onPress={() => { setType(value); setCategoryId(''); }} style={[styles.choice, type === value && styles.choiceActive]}><Text style={[ui.text, type === value && styles.choiceText]}>{value === 'EXPENSE' ? 'Khoản chi' : 'Khoản thu'}</Text></Pressable>)}</View>
    <Field label="Số tiền" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
    <Text style={ui.muted}>Chọn ví</Text>
    <View style={styles.wrap}>{wallets.data?.map((wallet) => <Pressable key={wallet.id} onPress={() => setWalletId(wallet.id)} style={[styles.pill, walletId === wallet.id && styles.pillActive]}><Text style={ui.text}>{wallet.name}</Text></Pressable>)}</View>
    <Text style={ui.muted}>Chọn danh mục</Text>
    <View style={styles.wrap}>{filteredCategories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.pill, categoryId === category.id && styles.pillActive]}><Text style={ui.text}>{category.name}</Text></Pressable>)}</View>
    {(wallets.isLoading || categories.isLoading) && <StateMessage loading message="Đang tải dữ liệu…" />}
    <Field label="Ghi chú" value={note} onChangeText={setNote} placeholder="Không bắt buộc" />
    {queued && <Card><Text accessibilityLiveRegion="polite" style={ui.positive}>Đã lưu vào hàng đợi. MoneyMate sẽ đồng bộ khi có mạng.</Text></Card>}
    {save.isError && <Text accessibilityLiveRegion="polite" style={ui.negative}>{save.error.message}</Text>}
    <Button label={id ? 'Lưu thay đổi' : 'Lưu giao dịch'} onPress={() => save.mutate()} loading={save.isPending} disabled={!walletId || !categoryId || !Number(amount) || (!!id && !existing.data)} />
  </Screen>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  pillActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceRaised },
  choice: { flex: 1, padding: 14, alignItems: 'center', borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  choiceActive: { backgroundColor: theme.colors.primaryStrong },
  choiceText: { fontWeight: '700' }
});
