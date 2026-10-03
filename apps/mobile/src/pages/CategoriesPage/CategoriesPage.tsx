import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon, type AppIconName } from '@/components/app-icon';
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
import { apiRequest } from '@/lib/api';
import type { Category } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

const CATEGORY_ICONS = [
  'tag',
  'utensils',
  'home',
  'car',
  'heart-pulse',
  'graduation-cap',
  'shopping-bag',
  'gamepad-2',
  'receipt',
  'briefcase',
  'gift',
  'more-horizontal',
];
const MATERIAL_ICONS: Record<string, AppIconName> = {
  tag: 'tag-outline',
  utensils: 'silverware-fork-knife',
  home: 'home-outline',
  car: 'car-outline',
  'heart-pulse': 'heart-pulse',
  'graduation-cap': 'school-outline',
  'shopping-bag': 'shopping-outline',
  'gamepad-2': 'gamepad-variant-outline',
  receipt: 'receipt-text-outline',
  briefcase: 'briefcase-outline',
  gift: 'gift-outline',
  'more-horizontal': 'dots-horizontal',
};

export default function CategoriesPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [color, setColor] = useState<string>(theme.colors.primary);
  const [icon, setIcon] = useState('tag');
  const [search, setSearch] = useState('');
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories'),
  });
  const save = useMutation({
    mutationFn: () =>
      apiRequest(editing ? `/categories/${editing.id}` : '/categories', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(
          editing ? { name, color, icon } : { name, type, color, icon },
        ),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
    },
    onError: (error) =>
      Alert.alert(
        'Không thể lưu danh mục',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error) =>
      Alert.alert(
        'Không thể xóa danh mục',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  const start = (item?: Category) => {
    setEditing(item || null);
    setName(item?.name || '');
    setType(item?.type || 'EXPENSE');
    setColor(item?.color || theme.colors.primary);
    setIcon(item?.icon || 'tag');
    setOpen(true);
  };
  const visible = (categories.data || []).filter(
    (item) =>
      item.type === type &&
      item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const custom = visible.filter((item) => item.userId !== null);
  const system = visible.filter((item) => item.userId === null);

  return (
    <Screen title="Danh mục">
      <PageHero
        title="Danh mục"
        subtitle="Quản lý danh mục chi tiêu & thu nhập"
      >
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <AppIcon name="magnify" size={23} color="rgba(255,255,255,.9)" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm kiếm danh mục…"
              placeholderTextColor="rgba(255,255,255,.75)"
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.heroAction} onPress={() => start()}>
            <AppIcon
              name="plus-circle-outline"
              size={21}
              color={theme.colors.primaryStrong}
            />
            <Text style={styles.heroActionText}>Thêm</Text>
          </Pressable>
        </View>
      </PageHero>
      <View style={styles.segment}>
        {(['EXPENSE', 'INCOME'] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setType(value)}
            style={[styles.segmentItem, type === value && styles.segmentActive]}
          >
            <AppIcon
              name={value === 'EXPENSE' ? 'trending-down' : 'trending-up'}
              size={18}
              color={
                type === value
                  ? value === 'EXPENSE'
                    ? theme.colors.danger
                    : theme.colors.success
                  : theme.colors.muted
              }
            />
            <Text
              style={[
                styles.segmentText,
                type === value && styles.segmentTextActive,
                type === value && {
                  color:
                    value === 'EXPENSE'
                      ? theme.colors.danger
                      : theme.colors.successStrong,
                },
              ]}
            >
              {value === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
            </Text>
          </Pressable>
        ))}
      </View>
      <SectionTitle
        title="Danh mục của bạn"
        caption={`${custom.length} danh mục`}
      />
      {categories.isLoading && (
        <StateMessage loading message="Đang tải danh mục…" />
      )}
      {!categories.isLoading && !visible.length && (
        <EmptyState
          icon="shape-plus-outline"
          title="Chưa có danh mục"
          message="Tạo danh mục để phân loại giao dịch rõ ràng hơn."
          action={<Button label="Thêm danh mục" onPress={() => start()} />}
        />
      )}
      <View style={[styles.grid, styles.customGrid]}>
        {custom.map((item) => (
          <CategoryTile
            key={item.id}
            item={item}
            editable
            onEdit={() => start(item)}
            onDelete={() =>
              Alert.alert('Xóa danh mục?', undefined, [
                { text: 'Hủy' },
                {
                  text: 'Xóa',
                  style: 'destructive',
                  onPress: () => remove.mutate(item.id),
                },
              ])
            }
          />
        ))}
      </View>
      {!!system.length && (
        <>
          <SectionTitle title="Danh mục mặc định" caption="Hệ thống" />
          <View style={styles.grid}>
            {system.map((item) => (
              <CategoryTile key={item.id} item={item} />
            ))}
          </View>
        </>
      )}
      <Sheet
        visible={open}
        title={editing ? 'Sửa danh mục' : 'Danh mục mới'}
        onClose={() => setOpen(false)}
      >
        <Field label="Tên danh mục" value={name} onChangeText={setName} />
        {!editing && (
          <>
            <Text style={ui.muted}>Loại danh mục</Text>
            <ChoiceChips
              value={type}
              options={[
                { label: 'Khoản chi', value: 'EXPENSE' },
                { label: 'Khoản thu', value: 'INCOME' },
              ]}
              onChange={setType}
            />
          </>
        )}
        <Field
          label="Màu HEX"
          value={color}
          onChangeText={setColor}
          autoCapitalize="characters"
        />
        <Text style={ui.muted}>Biểu tượng</Text>
        <ChoiceChips
          value={icon}
          options={CATEGORY_ICONS.map((value) => ({ label: value, value }))}
          onChange={setIcon}
        />
        <Button
          label="Lưu danh mục"
          disabled={!name.trim() || !/^#[0-9a-f]{6}$/i.test(color)}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </Sheet>
    </Screen>
  );

  function CategoryTile({
    item,
    editable,
    onEdit,
    onDelete,
  }: {
    item: Category;
    editable?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
  }) {
    const tileIcon = MATERIAL_ICONS[item.icon || 'tag'] || 'tag-outline';
    return (
      <Pressable
        onLongPress={editable ? onDelete : undefined}
        style={[styles.tile, editable && styles.customTile]}
      >
        <View style={styles.tileTop}>
          <Text style={[styles.tileBadge, { color: item.color }]}>
            {editable ? 'TÙY BIẾN' : 'MẶC ĐỊNH'}
          </Text>
          {editable && (
            <Pressable accessibilityLabel={`Sửa ${item.name}`} onPress={onEdit}>
              <AppIcon
                name="pencil-outline"
                size={18}
                color={theme.colors.muted}
              />
            </Pressable>
          )}
        </View>
        <View style={[styles.tileIcon, { backgroundColor: item.color }]}>
          <AppIcon name={tileIcon} size={25} color={theme.colors.onBrand} />
        </View>
        <Text numberOfLines={2} style={styles.tileName}>
          {item.name}
        </Text>
        {!editable && <Text style={styles.defaultPill}>Mặc định</Text>}
      </Pressable>
    );
  }
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroAction: {
      height: 48,
      paddingHorizontal: 18,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.onBrand,
    },
    heroActionText: {
      color: theme.colors.primaryStrong,
      fontSize: 15,
      fontWeight: '900',
    },
    searchRow: { marginTop: 16, flexDirection: 'row', gap: 8 },
    search: {
      flex: 1,
      height: 48,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,.17)',
    },
    searchInput: {
      flex: 1,
      color: theme.colors.onBrand,
      fontSize: 14,
      fontWeight: '700',
    },
    segment: {
      minHeight: 54,
      padding: 5,
      flexDirection: 'row',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    segmentItem: {
      flex: 1,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    segmentActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 7,
      elevation: 2,
    },
    segmentText: { color: theme.colors.muted, fontSize: 15, fontWeight: '800' },
    segmentTextActive: { fontWeight: '900' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    customGrid: { flexWrap: 'nowrap' },
    tile: {
      width: '48.6%',
      minHeight: 154,
      padding: 14,
      alignItems: 'center',
      borderRadius: 17,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : '#ECECF4',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 1,
    },
    customTile: { flex: 1, width: 'auto', minWidth: 0, paddingHorizontal: 10 },
    tileTop: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tileBadge: { fontSize: 9, fontWeight: '900' },
    tileIcon: {
      width: 53,
      height: 53,
      marginTop: 12,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileName: {
      marginTop: 11,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
      textAlign: 'center',
    },
    defaultPill: {
      marginTop: 7,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 99,
      overflow: 'hidden',
      color: theme.colors.muted,
      backgroundColor: theme.colors.primarySoft,
      fontSize: 10,
      fontWeight: '700',
    },
  });
