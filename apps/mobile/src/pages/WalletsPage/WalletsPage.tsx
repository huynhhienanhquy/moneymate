import { SectionHeading } from '@/components/design';
import { Text } from '@/components/design-text';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import { useRouter, type Href } from 'expo-router';
import {
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  Screen,
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

/**
 * Render the wallets page interface.
 *
 * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered wallets page interface.
 */
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
    /**
     * Load wallets page data for the query cache.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting wallets page value for the caller.
     */
    queryFn: () => apiRequest<Wallet[]>('/wallets'),
  });
  /**
   * Refresh wallet data used by the wallets page workflow.
   *
   * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
   * @returns The resulting wallets page value for the caller.
   */
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
    /**
     * Execute the wallets page mutation requested by the client.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting wallets page value for the caller.
     */
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
    /**
     * Finalize the wallets page workflow after a successful operation.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns A promise that resolves after the operation completes.
     */
    onSuccess: async () => {
      await refreshWalletData();
      setOpen(false);
    },
    /**
     * Map a failed wallets page operation into user-visible state.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @param e - The e value required by the operation.
     * @returns The resulting wallets page value for the caller.
     */
    onError: (e) =>
      Alert.alert(
        'Không thể lưu ví',
        e instanceof Error ? e.message : 'Vui lòng thử lại',
      ),
  });
  const remove = useMutation({
    /**
     * Execute the wallets page mutation requested by the client.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting wallets page value for the caller.
     */
    mutationFn: (id: string) =>
      apiRequest(`/wallets/${id}`, { method: 'DELETE' }),
    /**
     * Finalize the wallets page workflow after a successful operation.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: () => {
      void refreshWalletData();
    },
    /**
     * Map a failed wallets page operation into user-visible state.
     *
     * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
     * @param e - The e value required by the operation.
     * @returns The resulting wallets page value for the caller.
     */
    onError: (e) =>
      Alert.alert(
        'Không thể xóa ví',
        e instanceof Error ? e.message : 'Vui lòng thử lại',
      ),
  });
  /**
   * Show create for wallets page.
   *
   * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const showCreate = () => {
    setEditing(null);
    setName('');
    setType('CASH');
    setBalance('0');
    setOpen(true);
  };
  /**
   * Show edit for wallets page.
   *
   * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
   * @param wallet - The wallet value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
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

  const allocation = [...data].sort(
    (a, b) => Number(b.initialBalance) - Number(a.initialBalance),
  );
  const assetColor = (wallet: Wallet) =>
    wallet.type === 'CASH'
      ? theme.colors.success
      : wallet.type === 'E_WALLET'
        ? '#D51A4C'
        : wallet.name.toLowerCase().includes('vpbank')
          ? theme.colors.primaryDeep
          : theme.colors.primary;
  return (
    <Screen title="Ví tài khoản" gutter={25}>
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletHero}
      >
        <View style={styles.heroTop}>
          <View style={ui.row}>
            <View style={styles.heroIcon}>
              <AppIcon name="wallet-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.heroLabel}>VÍ TÀI KHOẢN</Text>
          </View>
          <Pressable
            accessibilityLabel={hidden ? 'Hiện số dư' : 'Ẩn số dư'}
            onPress={() => setHidden((value) => !value)}
            style={styles.hideButton}
          >
            <AppIcon
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.hideText}>{hidden ? 'Hiện' : 'Ẩn'}</Text>
          </Pressable>
        </View>
        <Text style={styles.heroCaption}>Tổng tài sản hiện có</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.heroBalance}>
          {hidden ? '●●●●●● đ' : money(total)}
        </Text>
        <View style={styles.heroActions}>
          <Pressable
            style={styles.secondaryHeroButton}
            onPress={() => router.push('/transfer' as Href)}
          >
            <AppIcon name="swap-horizontal" size={22} color="#FFFFFF" />
            <Text style={styles.secondaryHeroText}>Chuyển tiền</Text>
          </Pressable>
          <Pressable style={styles.primaryHeroButton} onPress={showCreate}>
            <AppIcon
              name="plus-circle-outline"
              size={22}
              color={theme.colors.primaryStrong}
            />
            <Text style={styles.primaryHeroText}>+ Thêm ví</Text>
          </Pressable>
        </View>
      </LinearGradient>
      <SectionHeading
        title="Danh sách ví"
        pill
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
                  /**
                   * Handle press for the wallets page workflow.
                   *
                   * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
                   * @returns The resulting wallets page value for the caller.
                   */
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
                {wallet.type === 'CASH' ? (
                  <View style={styles.walletLock}>
                    <AppIcon name="lock-outline" size={19} color="#FFFFFF" />
                  </View>
                ) : wallet.name.toLowerCase().includes('techcombank') ? (
                  <View style={styles.cardChip} />
                ) : (
                  <Text style={styles.walletTypeBadge}>
                    {wallet.type === 'E_WALLET' ? 'E-Wallet' : 'Tài khoản'}
                  </Text>
                )}
              </View>
              <Text style={styles.walletNumber}>
                {wallet.type === 'CASH'
                  ? 'Ví tiền mặt trực tiếp'
                  : wallet.type === 'E_WALLET'
                    ? 'Ví điện tử cá nhân'
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
      <Pressable style={styles.addWallet} onPress={showCreate}>
        <AppIcon name="plus" size={24} color={theme.colors.primaryStrong} />
        <Text style={styles.addWalletText}>Tạo tài khoản / ví mới</Text>
      </Pressable>
      {!!data.length && (
        <View style={styles.assetCard}>
          <View style={styles.assetHeader}>
            <Text style={styles.assetTitle}>Tỷ trọng tài sản</Text>
            <Text style={ui.muted}>{data.length} nguồn tiền</Text>
          </View>
          <View style={styles.assetBar}>
            {allocation.map((wallet) => (
              <View
                key={wallet.id}
                style={{
                  flex: Math.max(Number(wallet.initialBalance), 1),
                  backgroundColor: assetColor(wallet),
                }}
              />
            ))}
          </View>
          <View style={styles.assetLegend}>
            {allocation.map((wallet) => {
              const color = assetColor(wallet);
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

/**
 * Create theme-aware style definitions for the wallets page interface.
 *
 * Use it to keep the wallets page workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    walletHero: {
      marginTop: 10,
      minHeight: 237,
      padding: 20,
      borderRadius: 16,
      boxShadow: '0px 4px 7px rgba(19,27,46,.12)',
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroIcon: {
      width: 33,
      height: 33,
      borderRadius: 9,
      backgroundColor: 'rgba(255,255,255,.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
    heroCaption: {
      marginTop: 18,
      color: '#C4D4FF',
      fontSize: 14,
      fontWeight: '500',
    },
    heroBalance: {
      marginTop: 15,
      color: '#FFFFFF',
      fontSize: 34,
      fontWeight: '600',
    },
    hideButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,.17)',
    },
    hideText: { color: theme.colors.onBrand, fontWeight: '500' },
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
    secondaryHeroText: { color: theme.colors.onBrand, fontWeight: '600' },
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
    primaryHeroText: { color: theme.colors.primaryStrong, fontWeight: '600' },
    sortButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    sort: { color: theme.colors.primaryStrong, fontWeight: '500' },
    walletLock: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,.17)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardChip: {
      width: 40,
      height: 30,
      borderRadius: 6,
      backgroundColor: '#D7B456',
      borderTopWidth: 7,
      borderTopColor: '#C69F40',
    },
    walletTypeBadge: {
      color: '#FFFFFF',
      backgroundColor: 'rgba(255,255,255,.18)',
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 13,
      fontWeight: '500',
    },
    walletCard: {
      minHeight: 182,
      padding: 19,
      borderRadius: 17,
      justifyContent: 'space-between',
      shadowColor: theme.colors.primaryDeep,
      shadowOpacity: 0.035,
      shadowRadius: 11,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    walletIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    walletIcon: {
      width: 50,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,.18)',
    },
    walletName: {
      color: theme.colors.onBrand,
      fontSize: 20,
      fontWeight: '600',
    },
    walletType: { color: 'rgba(255,255,255,.82)', fontSize: 15, marginTop: 2 },
    walletNumber: {
      color: 'rgba(255,255,255,.8)',
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.7,
    },
    walletBalanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    walletBalance: {
      color: theme.colors.onBrand,
      fontSize: 28,
      fontWeight: '600',
    },
    assetCard: {
      padding: 18,
      borderRadius: 17,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : '#ECECF4',
    },
    assetHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    assetTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600' },
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
    assetLegendText: { flex: 1, color: theme.colors.muted, fontSize: 14 },
    addWallet: {
      minHeight: 80,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 17,
      backgroundColor: theme.colors.surfaceRaised,
    },
    addWalletText: {
      color: theme.colors.primaryStrong,
      fontSize: 16,
      fontWeight: '600',
    },
  });
