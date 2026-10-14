import { LinearGradient } from 'expo-linear-gradient';
import { SectionHeading, categoryAppearance } from '@/components/design';
import { Text, TextInput } from '@/components/design-text';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
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
  airplane: 'airplane',
  plane: 'plane',
  dumbbell: 'dumbbell',
  'more-horizontal': 'dots-horizontal',
};

/**
 * Render the categories page interface.
 *
 * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered categories page interface.
 */
export default function CategoriesPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width), [theme, width]);
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
    /**
     * Load categories page data for the query cache.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting categories page value for the caller.
     */
    queryFn: () => apiRequest<Category[]>('/categories'),
  });
  const save = useMutation({
    /**
     * Execute the categories page mutation requested by the client.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting categories page value for the caller.
     */
    mutationFn: () =>
      apiRequest(editing ? `/categories/${editing.id}` : '/categories', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(
          editing ? { name, color, icon } : { name, type, color, icon },
        ),
      }),
    /**
     * Finalize the categories page workflow after a successful operation.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
    },
    /**
     * Map a failed categories page operation into user-visible state.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @param error - The failure value to classify, report, or propagate.
     * @returns The resulting categories page value for the caller.
     */
    onError: (error) =>
      Alert.alert(
        'Không thể lưu danh mục',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  const remove = useMutation({
    /**
     * Execute the categories page mutation requested by the client.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting categories page value for the caller.
     */
    mutationFn: (id: string) =>
      apiRequest(`/categories/${id}`, { method: 'DELETE' }),
    /**
     * Finalize the categories page workflow after a successful operation.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting categories page value for the caller.
     */
    onSuccess: () => client.invalidateQueries({ queryKey: ['categories'] }),
    /**
     * Map a failed categories page operation into user-visible state.
     *
     * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
     * @param error - The failure value to classify, report, or propagate.
     * @returns The resulting categories page value for the caller.
     */
    onError: (error) =>
      Alert.alert(
        'Không thể xóa danh mục',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  /**
   * Start categories page for the categories page workflow.
   *
   * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
   * @param item - The item value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
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
  const defaultOrder = [
    'Ăn uống',
    'Di chuyển',
    'Giải trí',
    'Giáo dục',
    'Hóa đơn & Tiện ích',
    'Mua sắm',
    'Sức khỏe',
    'Thuê nhà',
    'Khác (Chi tiêu)',
  ];
  const system = visible
    .filter((item) => item.userId === null)
    .sort((a, b) => {
      const left = defaultOrder.indexOf(a.name);
      const right = defaultOrder.indexOf(b.name);
      return (left < 0 ? 99 : left) - (right < 0 ? 99 : right);
    });

  return (
    <Screen title="Danh mục">
      <PageHero
        title="Danh mục"
        subtitle="Quản lý danh mục chi tiêu & thu nhập"
        subtitleStyle={{ maxWidth: width - theme.sizes.screenGutter * 2 - 104 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chọn loại danh mục"
          style={styles.heroFilter}
          onPress={() =>
            Alert.alert('Loại danh mục', undefined, [
              { text: 'Chi tiêu', onPress: () => setType('EXPENSE') },
              { text: 'Thu nhập', onPress: () => setType('INCOME') },
              { text: 'Hủy', style: 'cancel' },
            ])
          }
        >
          <AppIcon name="tune-variant" size={25} color={theme.colors.onBrand} />
        </Pressable>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <AppIcon
              name="magnify"
              size={23}
              color="rgba(255,255,255,.9)"
              style={{ flexShrink: 0 }}
            />
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
      <SectionHeading
        style={{ marginTop: 0, marginBottom: -10 }}
        icon="tag-outline"
        pill
        title="DANH MỤC CỦA BẠN"
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
                  /**
                   * Handle press for the categories page workflow.
                   *
                   * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
                   * @returns The resulting categories page value for the caller.
                   */
                  onPress: () => remove.mutate(item.id),
                },
              ])
            }
          />
        ))}
      </View>
      {!!system.length && (
        <>
          <SectionHeading
            style={{ marginTop: 0, marginBottom: -10 }}
            icon="view-grid-outline"
            title="DANH MỤC MẶC ĐỊNH"
            caption="Hệ thống"
          />
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

  /**
   * Render the category tile interface.
   *
   * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
   * @param props - The properties that configure this React component.
   * @returns The rendered category tile interface.
   */
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
    const appearance = categoryAppearance(item.name);
    const tileIcon =
      !editable && defaultOrder.includes(item.name)
        ? appearance.icon
        : MATERIAL_ICONS[item.icon || 'tag'] || appearance.icon;
    const other = !editable && /khác/i.test(item.name);
    return (
      <Pressable
        onLongPress={editable ? onDelete : undefined}
        style={[
          styles.tile,
          editable && styles.customTile,
          other && styles.otherTile,
        ]}
      >
        {editable && (
          <View style={styles.tileTop}>
            <Text style={[styles.tileBadge, { color: item.color }]}>
              {editable ? 'TÙY BIẾN' : 'MẶC ĐỊNH'}
            </Text>
            {editable && (
              <Pressable
                accessibilityLabel={`Sửa ${item.name}`}
                onPress={onEdit}
              >
                <AppIcon
                  name="pencil-outline"
                  size={18}
                  color={theme.colors.muted}
                />
              </Pressable>
            )}
          </View>
        )}
        <LinearGradient
          colors={
            editable ? [item.color, item.color] : [...appearance.gradient]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tileIcon, other && { marginTop: 0 }]}
        >
          <AppIcon name={tileIcon} size={25} color={theme.colors.onBrand} />
        </LinearGradient>
        {other ? (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.tileName, { textAlign: 'left', marginTop: 0 }]}
            >
              {item.name}
            </Text>
            <Text style={styles.otherDescription}>
              Các chi tiêu vặt phát sinh
            </Text>
          </View>
        ) : (
          <Text numberOfLines={2} style={styles.tileName}>
            {item.name}
          </Text>
        )}
        {!editable && <Text style={styles.defaultPill}>Mặc định</Text>}
      </Pressable>
    );
  }
}

/**
 * Create theme-aware style definitions for the categories page interface.
 *
 * Use it to keep the categories page workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme, screenWidth: number) =>
  StyleSheet.create({
    heroFilter: {
      position: 'absolute',
      top: 26,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,.2)',
    },
    heroAction: {
      height: 42,
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
      fontWeight: '600',
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
      minWidth: 0,
      color: theme.colors.onBrand,
      fontSize: 16,
      fontWeight: '600',
    },
    segment: {
      minHeight: 52,
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
    segmentText: { color: theme.colors.muted, fontSize: 15, fontWeight: '500' },
    segmentTextActive: { fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    customGrid: { flexWrap: 'wrap' },
    tile: {
      width: (screenWidth - theme.sizes.screenGutter * 2 - 10) / 2,
      minHeight: 168,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 2px 2px rgba(19,27,46,.035)',
    },
    customTile: {
      width: (screenWidth - theme.sizes.screenGutter * 2 - 20) / 3,
      minWidth: 0,
      minHeight: 160,
      paddingHorizontal: 15,
    },
    otherTile: {
      width: '100%',
      minHeight: 100,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 12,
    },
    tileTop: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tileBadge: { fontSize: 11, fontWeight: '600' },
    tileIcon: {
      width: 60,
      height: 60,
      marginTop: 12,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileName: {
      marginTop: 11,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    otherDescription: {
      color: theme.colors.muted,
      fontSize: 14,
    },
    defaultPill: {
      marginTop: 7,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 99,
      overflow: 'hidden',
      color: theme.colors.muted,
      backgroundColor: theme.colors.primarySoft,
      fontSize: 13,
      fontWeight: '600',
    },
  });
