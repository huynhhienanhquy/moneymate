import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import { useRouter, type Href } from 'expo-router';
import {
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  PageHero,
  Screen,
  SectionTitle,
  Sheet,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { money } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import type { Wallet } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

const walletTypes = [
  { label: 'Tiền mặt', value: 'CASH' },
  { label: 'Ngân hàng', value: 'BANK' },
  { label: 'Ví điện tử', value: 'E_WALLET' },
];
const walletPalettes = {
  CASH: ['#087F5B', '#55E4B1'],
  BANK: ['#004AC6', '#2D73F5'],
  E_WALLET: ['#D92350', '#B9003A'],
} as const;

export default function WalletsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sortBy, setSortBy] = useState<'ORIGINAL' | 'BALANCE' | 'NAME'>(
    'ORIGINAL',
  );
  const [name, setName] = useState('');
  const [type, setType] = useState('CASH');
  const [balance, setBalance] = useState('0');
  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiRequest<Wallet[]>('/wallets'),
  });
  const refreshWalletData = () =>
    Promise.all(
      [
        'wallets',
        'dashboard',
        'monthly-report',
        'yearly-report',
        'year-report',
        'monthly-trend',
        'trend',
      ].map((queryKey) => client.invalidateQueries({ queryKey: [queryKey] })),
    );
  const save = useMutation({
    mutationFn: () =>
      apiRequest(editing ? `/wallets/${editing.id}` : '/wallets', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: name.trim(),
          type,
          initialBalance: Number(balance),
          ...(!editing ? { currency: 'VND' } : {}),
        }),
      }),
    onSuccess: async () => {
      await refreshWalletData();
      setOpen(false);
    },
    onError: (e) =>
      Alert.alert(
        'Không thể lưu ví',
        e instanceof Error ? e.message : 'Vui lòng thử lại',
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/wallets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void refreshWalletData();
    },
    onError: (e) =>
      Alert.alert(
        'Không thể xóa ví',
        e instanceof Error ? e.message : 'Vui lòng thử lại',
      ),
  });
  const showCreate = () => {
    setEditing(null);
    setName('');
    setType('CASH');
    setBalance('0');
    setOpen(true);
  };
  const showEdit = (wallet: Wallet) => {
    setEditing(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(String(wallet.initialBalance));
    setOpen(true);
  };
  const total = (wallets.data || []).reduce(
    (sum, wallet) => sum + Number(wallet.initialBalance),
    0,
  );
  const data = [...(wallets.data || [])].sort((left, right) =>
    sortBy === 'NAME'
      ? left.name.localeCompare(right.name, 'vi')
      : sortBy === 'BALANCE'
        ? Number(right.initialBalance) - Number(left.initialBalance)
        : 0,
  );

  return (
    <Screen title="Ví tài khoản">
      <PageHero
        eyebrow="VÍ TÀI KHOẢN"
        title={hidden ? '•••••• ₫' : money(total)}
        subtitle="Tổng tài sản hiện có"
        icon="wallet-outline"
        action={
          <Pressable
            onPress={() => setHidden((value) => !value)}
            style={styles.hideButton}
          >
            <AppIcon
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={theme.colors.onBrand}
            />
            <Text style={styles.hideText}>{hidden ? 'Hiện' : 'Ẩn'}</Text>
          </Pressable>
        }
      >
        <View style={styles.heroActions}>
          <Pressable
            style={styles.secondaryHeroButton}
            onPress={() => router.push('/transfer' as Href)}
          >
            <AppIcon
              name="swap-horizontal"
              size={21}
              color={theme.colors.onBrand}
            />
            <Text style={styles.secondaryHeroText}>Chuyển tiền</Text>
          </Pressable>
          <Pressable style={styles.primaryHeroButton} onPress={showCreate}>
            <AppIcon
              name="plus-circle-outline"
              size={21}
              color={theme.colors.primaryStrong}
            />
            <Text style={styles.primaryHeroText}>Thêm ví</Text>
          </Pressable>
        </View>
      </PageHero>
      <SectionTitle
        title="Danh sách ví"
        caption={`${data.length} tài khoản`}
        action={
          <Pressable
            style={styles.sortButton}
            onPress={() =>
              Alert.alert('Sắp xếp ví', undefined, [
                { text: 'Mặc định', onPress: () => setSortBy('ORIGINAL') },
                { text: 'Theo số dư', onPress: () => setSortBy('BALANCE') },
                { text: 'Theo tên', onPress: () => setSortBy('NAME') },
                { text: 'Hủy', style: 'cancel' },
              ])
            }
          >
            <AppIcon name="sort" size={16} color={theme.colors.primaryStrong} />
            <Text style={styles.sort}>Sắp xếp</Text>
          </Pressable>
        }
      />
      {wallets.isLoading && <StateMessage loading message="Đang tải ví…" />}
      {wallets.isError && (
        <StateMessage message="Không thể tải danh sách ví." />
      )}
      {!wallets.isLoading && !data.length && (
        <EmptyState
          icon="wallet-plus-outline"
          title="Chưa có ví"
          message="Tạo ví đầu tiên để bắt đầu theo dõi số dư."
          action={<Button label="Tạo ví" onPress={showCreate} />}
        />
      )}
      {data.map((wallet, index) => {
        const palette = wallet.name.toLowerCase().includes('vpbank')
          ? (['#001D59', '#0757D8'] as const)
          : walletPalettes[wallet.type as keyof typeof walletPalettes] ||
            (index % 2
              ? (['#001D59', '#0757D8'] as const)
              : (['#004AC6', '#2D73F5'] as const));
        return (
          <Pressable
            key={wallet.id}
            onPress={() => showEdit(wallet)}
            onLongPress={() =>
              Alert.alert('Xóa ví?', 'Lịch sử giao dịch được giữ lại.', [
                { text: 'Hủy' },
                {
                  text: 'Xóa',
                  style: 'destructive',
                  onPress: () => remove.mutate(wallet.id),
                },
              ])
            }
          >
            <LinearGradient
              colors={[...palette]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <View style={styles.walletHeader}>
                <View style={styles.walletIdentity}>
                  <View style={styles.walletIcon}>
                    <AppIcon
                      name={
                        wallet.type === 'CASH'
                          ? 'cash-multiple'
                          : wallet.type === 'E_WALLET'
                            ? 'contactless-payment-circle-outline'
                            : 'bank-outline'
                      }
                      size={25}
                      color={theme.colors.onBrand}
                    />
                  </View>
                  <View>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletType}>
                      {wallet.type === 'CASH'
                        ? 'Tiền mặt'
                        : wallet.type === 'BANK'
                          ? 'Ngân hàng'
                          : 'Ví điện tử'}
                    </Text>
                  </View>
                </View>
                <AppIcon
                  name="credit-card-chip-outline"
                  size={31}
                  color="rgba(255,255,255,.75)"
                />
              </View>
              <Text style={styles.walletNumber}>
                {wallet.type === 'CASH'
                  ? 'VÍ TIỀN MẶT TRỰC TIẾP'
                  : '••••  ' + wallet.id.slice(-4).toUpperCase()}
              </Text>
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletBalance}>
                  {hidden ? '••••' : money(wallet.initialBalance)}
                </Text>
                <AppIcon
                  name="arrow-right"
                  size={27}
                  color={theme.colors.onBrand}
                />
              </View>
            </LinearGradient>
          </Pressable>
        );
      })}
      {!!data.length && (
        <View style={styles.assetCard}>
          <View style={styles.assetHeader}>
            <Text style={styles.assetTitle}>Tỷ trọng tài sản</Text>
            <Text style={ui.muted}>{data.length} nguồn tiền</Text>
          </View>
          <View style={styles.assetBar}>
            {data.map((wallet, index) => (
              <View
                key={wallet.id}
                style={{
                  flex: Math.max(Number(wallet.initialBalance), 1),
                  backgroundColor:
                    index % 3 === 0
                      ? theme.colors.success
                      : index % 3 === 1
                        ? theme.colors.primaryDeep
                        : theme.colors.danger,
                }}
              />
            ))}
          </View>
          <View style={styles.assetLegend}>
            {data.map((wallet, index) => {
              const color =
                index % 3 === 0
                  ? theme.colors.success
                  : index % 3 === 1
                    ? theme.colors.primaryDeep
                    : theme.colors.danger;
              const percentage =
                total > 0
                  ? Math.round((Number(wallet.initialBalance) / total) * 100)
                  : 0;
              return (
                <View key={wallet.id} style={styles.assetLegendItem}>
                  <View style={[styles.assetDot, { backgroundColor: color }]} />
                  <Text numberOfLines={1} style={styles.assetLegendText}>
                    {wallet.name} ({percentage}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
      <Pressable style={styles.addWallet} onPress={showCreate}>
        <AppIcon name="plus" size={24} color={theme.colors.primaryStrong} />
        <Text style={styles.addWalletText}>Tạo tài khoản / ví mới</Text>
      </Pressable>
      <Sheet
        visible={open}
        title={editing ? 'Chỉnh sửa ví' : 'Tạo ví mới'}
        onClose={() => setOpen(false)}
      >
        <Field label="Tên ví" value={name} onChangeText={setName} />
        <Text style={ui.muted}>Loại ví</Text>
        <ChoiceChips value={type} options={walletTypes} onChange={setType} />
        <Field
          label={editing ? 'Số dư hiện tại' : 'Số dư ban đầu'}
          value={balance}
          onChangeText={setBalance}
          keyboardType="numeric"
        />
        <Button
          label={editing ? 'Lưu thay đổi' : 'Tạo ví'}
          loading={save.isPending}
          disabled={!name.trim() || Number(balance) < 0}
          onPress={() => save.mutate()}
        />
      </Sheet>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    hideButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,.17)',
    },
    hideText: { color: theme.colors.onBrand, fontWeight: '800' },
    heroActions: { marginTop: 17, flexDirection: 'row', gap: 10 },
    secondaryHeroButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: 'rgba(255,255,255,.18)',
    },
    secondaryHeroText: { color: theme.colors.onBrand, fontWeight: '900' },
    primaryHeroButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: theme.colors.onBrand,
    },
    primaryHeroText: { color: theme.colors.primaryStrong, fontWeight: '900' },
    sortButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    sort: { color: theme.colors.primaryStrong, fontWeight: '800' },
    walletCard: {
      minHeight: 170,
      padding: 19,
      borderRadius: 17,
      justifyContent: 'space-between',
      shadowColor: theme.colors.primaryDeep,
      shadowOpacity: 0.2,
      shadowRadius: 11,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    walletIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    walletIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,.18)',
    },
    walletName: {
      color: theme.colors.onBrand,
      fontSize: 18,
      fontWeight: '900',
    },
    walletType: { color: 'rgba(255,255,255,.82)', fontSize: 12, marginTop: 2 },
    walletNumber: {
      color: 'rgba(255,255,255,.8)',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    walletBalanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    walletBalance: {
      color: theme.colors.onBrand,
      fontSize: 27,
      fontWeight: '900',
    },
    assetCard: {
      padding: 18,
      borderRadius: 17,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : '#ECECF4',
    },
    assetHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    assetTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
    assetBar: {
      height: 13,
      marginTop: 15,
      borderRadius: 7,
      overflow: 'hidden',
      flexDirection: 'row',
      backgroundColor: theme.colors.primarySoft,
    },
    assetLegend: {
      marginTop: 13,
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 8,
    },
    assetLegendItem: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    assetDot: { width: 9, height: 9, borderRadius: 5 },
    assetLegendText: { flex: 1, color: theme.colors.muted, fontSize: 11 },
    addWallet: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 17,
      backgroundColor: theme.colors.primarySoft,
    },
    addWalletText: {
      color: theme.colors.primaryStrong,
      fontSize: 16,
      fontWeight: '900',
    },
  });
