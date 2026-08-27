import { useState } from 'react';
import { Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button, ChoiceChips, Field, Screen, StateMessage, ui } from '@/components/ui';
import { apiRequest } from '@/lib/api';
import type { Wallet } from '@/types/api';

export default function TransferPage() {
  const router = useRouter(); const client = useQueryClient(); const [sourceWalletId, setSource] = useState(''); const [destinationWalletId, setDestination] = useState(''); const [amount, setAmount] = useState(''); const [note, setNote] = useState('');
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: () => apiRequest<Wallet[]>('/wallets') });
  const transfer = useMutation({ mutationFn: () => apiRequest('/transactions/transfer', { method: 'POST', headers: { 'Idempotency-Key': Crypto.randomUUID() }, body: JSON.stringify({ sourceWalletId, destinationWalletId, amount: Number(amount), note: note || undefined, transferDate: new Date().toISOString() }) }), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['wallets'] }), client.invalidateQueries({ queryKey: ['transactions'] })]); router.back(); } });
  const options = (wallets.data || []).map((item) => ({ label: item.name, value: item.id }));
  return <Screen title="Chuyển tiền">{wallets.isLoading && <StateMessage loading message="Đang tải ví…" />}<Text style={ui.muted}>Ví nguồn</Text><ChoiceChips value={sourceWalletId} options={options} onChange={setSource} /><Text style={ui.muted}>Ví nhận</Text><ChoiceChips value={destinationWalletId} options={options.filter((item) => item.value !== sourceWalletId)} onChange={setDestination} /><Field label="Số tiền" value={amount} onChangeText={setAmount} keyboardType="numeric" /><Field label="Ghi chú" value={note} onChangeText={setNote} />{transfer.isError && <Text style={ui.negative}>{transfer.error.message}</Text>}<Button label="Xác nhận chuyển tiền" loading={transfer.isPending} disabled={!sourceWalletId || !destinationWalletId || sourceWalletId === destinationWalletId || Number(amount) <= 0} onPress={() => transfer.mutate()} /></Screen>;
}
