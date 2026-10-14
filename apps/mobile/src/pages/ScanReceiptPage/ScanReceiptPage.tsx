import { Text } from '@/components/design-text';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AppIcon } from '@/components/app-icon';
import { useRouter, type Href } from 'expo-router';
import { Button, Screen, useUiStyles } from '@/components/ui';
import { apiRequest } from '@/lib/api';
import { toLocalDateInputValue } from '@/lib/date';
import { useAppTheme, type AppTheme } from '@/theme';
import { APP_IMAGES } from '@/lib/app-images';
import { categoryAppearance } from '@/components/design';
import { money } from '@/components/finance';

interface ReceiptResult {
  amount?: number | null;
  transactionDate?: string | null;
  merchant?: string | null;
  note?: string | null;
  suggestedCategoryId?: string | null;
  suggestedCategoryName?: string | null;
  rawText?: string;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Render the scan receipt page interface.
 *
 * Use it to keep the scan receipt page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered scan receipt page interface.
 */
export default function ScanReceiptPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const analyzeAsset = useCallback(
    async (nextAsset: ImagePicker.ImagePickerAsset) => {
      setLoading(true);
      setError('');
      try {
        const form = new FormData();
        if (Platform.OS === 'web' && nextAsset.file) {
          form.append(
            'file',
            nextAsset.file,
            nextAsset.fileName || 'receipt.jpg',
          );
        } else
          form.append('file', {
            uri: nextAsset.uri,
            name: nextAsset.fileName || 'receipt.jpg',
            type: nextAsset.mimeType || 'image/jpeg',
          } as unknown as Blob);
        setResult(
          await apiRequest<ReceiptResult>('/ai/receipt/scan', {
            method: 'POST',
            body: form,
          }),
        );
      } catch (scanError) {
        setError(
          scanError instanceof Error
            ? scanError.message
            : 'Không thể quét hóa đơn',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );
  const applyCapturedAsset = useCallback(
    (nextAsset: ImagePicker.ImagePickerAsset) => {
      setAsset(nextAsset);
      setResult(null);
      setError('');
      void analyzeAsset(nextAsset);
    },
    [analyzeAsset],
  );
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void ImagePicker.getPendingResultAsync()
      .then((pending) => {
        if (!pending) return;
        if ('code' in pending)
          setError(pending.message || 'Không thể khôi phục ảnh hóa đơn.');
        else if (!pending.canceled && pending.assets[0])
          applyCapturedAsset(pending.assets[0]);
      })
      .catch(() => undefined);
  }, [applyCapturedAsset]);
  /**
   * Capture for scan receipt page.
   *
   * Use it to keep the scan receipt page workflow's presentation and interactions in one reusable UI boundary.
   * @returns A promise that resolves after the operation completes.
   */
  const capture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Cần quyền camera để quét hóa đơn.');
        return;
      }
      const image = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!image.canceled && image.assets[0])
        applyCapturedAsset(image.assets[0]);
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : 'Không thể mở camera.',
      );
    }
  };
  /**
   * Pick for scan receipt page.
   *
   * Use it to keep the scan receipt page workflow's presentation and interactions in one reusable UI boundary.
   * @returns A promise that resolves after the operation completes.
   */
  const pick = async () => {
    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!image.canceled && image.assets[0]) applyCapturedAsset(image.assets[0]);
  };
  /**
   * Open transaction form in the scan receipt page interface.
   *
   * Use it to keep the scan receipt page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const openTransactionForm = () => {
    router.push({
      pathname: '/add-transaction',
      params: {
        type: 'EXPENSE',
        amount: result?.amount ? String(result.amount) : '',
        note: result?.note || result?.merchant || '',
        transactionDate: result?.transactionDate || toLocalDateInputValue(),
        categoryId: result?.suggestedCategoryId || '',
        receiptUri: asset?.uri || '',
        receiptName: asset?.fileName || 'receipt.jpg',
        receiptType: asset?.mimeType || 'image/jpeg',
      },
    });
  };
  const recognizedFields = result
    ? [
        result.amount,
        result.transactionDate,
        result.merchant,
        result.note,
        result.suggestedCategoryId,
      ].filter(Boolean).length
    : 0;
  const confidenceLabel =
    result?.confidence === 'high'
      ? 'Độ tin cậy cao'
      : result?.confidence === 'medium'
        ? 'Cần kiểm tra lại'
        : 'Cần xác nhận';
  const categoryStyle = categoryAppearance(
    result?.suggestedCategoryName || 'Ăn uống',
  );

  return (
    <Screen title="Quét hóa đơn" bottomNav={false} showTopBar={false}>
      <View style={styles.scannerHeader}>
        <Pressable
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <AppIcon name="close" size={29} color={theme.colors.text} />
        </Pressable>
        <View style={styles.brand}>
          <Image
            source={APP_IMAGES.logo}
            accessibilityLabel="Logo MoneyMate"
            contentFit="cover"
            style={styles.brandLogo}
          />
          <View>
            <Text style={styles.brandName}>MoneyMate</Text>
            <Text style={styles.brandCaption}>SMART FINANCE</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Quét Hóa đơn
        </Text>
        <Pressable
          accessibilityLabel="Mở camera để dùng đèn flash"
          onPress={() => void capture()}
          style={styles.headerButton}
        >
          <AppIcon name="flash-outline" size={27} color={theme.colors.text} />
        </Pressable>
        <Pressable
          accessibilityLabel="Mở bộ sưu tập"
          onPress={() => void pick()}
          style={styles.headerButton}
        >
          <AppIcon
            name="image-multiple-outline"
            size={26}
            color={theme.colors.text}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Mở hồ sơ"
          onPress={() => router.push('/(tabs)/profile' as Href)}
          style={styles.profileButton}
        >
          <AppIcon
            name="account-outline"
            size={22}
            color={theme.colors.onBrand}
          />
        </Pressable>
      </View>
      <View style={styles.modeRow}>
        <View style={styles.modeGroup}>
          <Pressable
            accessibilityLabel="Quét hóa đơn tự động"
            onPress={() => void capture()}
            style={styles.modeActive}
          >
            <AppIcon name="creation" size={18} color={theme.colors.onBrand} />
            <Text style={styles.modeActiveText}>Tự động</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Nhập giao dịch thủ công"
            onPress={openTransactionForm}
            style={styles.mode}
          >
            <Text style={styles.modeText}>Thủ công</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="Mở camera để dùng đèn flash"
          onPress={() => void capture()}
          style={styles.flash}
        >
          <AppIcon name="flash-outline" size={22} color="#FFAE00" />
          <Text style={styles.modeText}>Bật</Text>
        </Pressable>
      </View>
      <View style={styles.cameraFrame}>
        {asset ? (
          <Image
            source={{ uri: asset.uri }}
            style={styles.preview}
            accessibilityLabel="Ảnh hóa đơn đã chụp"
          />
        ) : (
          <View style={styles.cameraEmpty}>
            <AppIcon
              name="receipt-text-outline"
              size={58}
              color="rgba(255,255,255,.55)"
            />
            <Text style={styles.cameraEmptyTitle}>Đưa hóa đơn vào khung</Text>
            <Text style={styles.cameraEmptyText}>
              MoneyMate AI sẽ tự nhận diện nội dung
            </Text>
          </View>
        )}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        {asset && (
          <View style={styles.detected}>
            <View style={styles.greenDot} />
            <Text style={styles.detectedText}>
              {result
                ? 'Đã nhận diện hóa đơn'
                : loading
                  ? 'Đang phân tích hóa đơn…'
                  : 'Đã phát hiện hóa đơn'}
            </Text>
          </View>
        )}
        <View style={styles.scanLine} />
        {result && (
          <>
            {result.merchant && (
              <View style={styles.merchantOverlay}>
                <AppIcon name="storefront-outline" size={15} color="#FFFFFF" />
                <Text numberOfLines={1} style={styles.overlayText}>
                  {result.merchant}
                </Text>
              </View>
            )}
            {result.amount != null && (
              <View style={styles.totalOverlay}>
                <View style={styles.totalTag}>
                  <AppIcon name="cash-multiple" size={15} color="#FFFFFF" />
                  <Text style={styles.overlayText}>Tổng tiền</Text>
                </View>
                <Text style={styles.overlayAmount}>{money(result.amount)}</Text>
              </View>
            )}
            {result.transactionDate && (
              <View style={styles.dateOverlay}>
                <AppIcon
                  name="calendar-blank-outline"
                  size={17}
                  color="#67E8F9"
                />
                <Text style={styles.overlayText}>
                  {new Date(result.transactionDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
      <View style={styles.hint}>
        <AppIcon
          name="scan-helper"
          size={22}
          color={theme.colors.primaryStrong}
        />
        <Text style={[ui.muted, { flex: 1 }]}>
          Căn chỉnh 4 góc hóa đơn vào khung để AI tự động bóc tách
        </Text>
      </View>
      {loading && (
        <View style={styles.analyzing}>
          <AppIcon
            name="creation"
            size={20}
            color={theme.colors.primaryStrong}
          />
          <Text style={styles.analyzingText}>
            MoneyMate AI đang bóc tách hóa đơn…
          </Text>
        </View>
      )}
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={ui.negative}>
          {error}
        </Text>
      )}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.aiIcon}>
              <AppIcon
                name="creation"
                size={24}
                color={theme.colors.primaryStrong}
              />
            </View>
            <View style={styles.flex}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  flexWrap: 'wrap',
                }}
              >
                <Text style={styles.resultTitle}>MoneyMate AI OCR</Text>
                <Text style={styles.version}>V3.2</Text>
              </View>
              <View style={styles.resultSuccessRow}>
                <AppIcon
                  name="check-circle-outline"
                  size={15}
                  color={theme.colors.successStrong}
                />
                <Text style={styles.resultSuccess}>
                  Đã nhận diện thành công {recognizedFields} trường
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={expanded ? 'Thu gọn kết quả' : 'Mở kết quả'}
              onPress={() => setExpanded((value) => !value)}
              style={styles.collapseButton}
            >
              <AppIcon
                name={expanded ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
          </View>
          {expanded && (
            <>
              <View style={styles.amountBox}>
                <Text style={ui.muted}>Tổng số tiền chi tiêu</Text>
                <Text style={styles.amount}>
                  {result.amount != null ? money(result.amount) : '—'}
                </Text>
                <Text style={styles.confidence}>{confidenceLabel}</Text>
              </View>
              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={ui.muted}>Danh mục</Text>
                  <View style={styles.resultChoice}>
                    <View
                      style={[
                        styles.choiceIcon,
                        { backgroundColor: '#FFF1C7' },
                      ]}
                    >
                      <AppIcon
                        name={categoryStyle.icon}
                        size={22}
                        color="#BC5100"
                      />
                    </View>
                    <Text numberOfLines={1} style={[ui.text, { flex: 1 }]}>
                      {result.suggestedCategoryName || 'Chưa nhận diện'}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultItem}>
                  <Text style={ui.muted}>Nguồn tiền</Text>
                  <View style={styles.resultChoice}>
                    <View
                      style={[
                        styles.choiceIcon,
                        { backgroundColor: '#FFE4F2' },
                      ]}
                    >
                      <AppIcon
                        name="wallet-outline"
                        size={22}
                        color="#F60086"
                      />
                    </View>
                    <Text style={ui.text}>Chọn khi lưu</Text>
                  </View>
                </View>
              </View>
              <View style={styles.merchant}>
                <AppIcon
                  name="storefront-outline"
                  size={21}
                  color={theme.colors.text}
                />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={ui.text}>
                    {result.merchant || 'Chưa nhận diện cửa hàng'}
                  </Text>
                  <Text style={ui.muted}>
                    {result.transactionDate
                      ? new Date(result.transactionDate).toLocaleDateString(
                          'vi-VN',
                        )
                      : 'Chưa nhận diện ngày'}
                  </Text>
                </View>
              </View>
              <View style={styles.resultActions}>
                <View style={styles.flex}>
                  <Button
                    variant="secondary"
                    label="Sửa"
                    icon="pencil-outline"
                    onPress={openTransactionForm}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Button
                    label="Lưu giao dịch"
                    icon="check-circle-outline"
                    onPress={openTransactionForm}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      )}
      <View style={styles.captureBar}>
        <Pressable style={styles.captureSide} onPress={() => void pick()}>
          <AppIcon
            name="image-multiple-outline"
            size={26}
            color={theme.colors.text}
          />
          <Text style={styles.captureSideText}>Bộ sưu tập</Text>
        </Pressable>
        <Pressable style={styles.captureMain} onPress={() => void capture()}>
          <View style={styles.captureCircle}>
            <AppIcon name="line-scan" size={33} color={theme.colors.onBrand} />
          </View>
          <Text style={styles.captureMainText}>
            {asset ? 'Chụp lại' : 'Chụp ngay'}
          </Text>
        </Pressable>
        <Pressable style={styles.captureSide} onPress={openTransactionForm}>
          <AppIcon
            name="keyboard-outline"
            size={27}
            color={theme.colors.text}
          />
          <Text style={styles.captureSideText}>Nhập tay</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

/**
 * Create theme-aware style definitions for the scan receipt page interface.
 *
 * Use it to keep the scan receipt page workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    resultCard: {
      padding: 20,
      gap: 14,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 4px 5px rgba(19,27,46,.15)',
    },
    collapseButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.neutralSoft,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '90deg' }],
    },
    resultChoice: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    choiceIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    merchantOverlay: {
      position: 'absolute',
      top: '28%',
      left: '16%',
      right: '16%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(0,77,206,.6)',
    },
    totalOverlay: {
      position: 'absolute',
      top: '52%',
      left: '17%',
      right: '17%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(135,230,187,.6)',
    },
    totalTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      padding: 7,
      borderRadius: 7,
      backgroundColor: '#007652',
    },
    overlayText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
      flexShrink: 1,
    },
    overlayAmount: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '600',
      flexShrink: 1,
    },
    dateOverlay: {
      position: 'absolute',
      top: '69%',
      left: '24%',
      right: '24%',
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(19,27,46,.8)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    scannerHeader: {
      minHeight: 70,
      marginHorizontal: -20,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? theme.colors.border : '#ECECF4',
    },
    headerButton: {
      width: 39,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    brandLogo: { width: 31, height: 31, borderRadius: 8 },
    brandName: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 12,
    },
    brandCaption: {
      color: theme.colors.muted,
      fontSize: 6,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    headerTitle: {
      flex: 1,
      marginLeft: 6,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '600',
    },
    profileButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryStrong,
    },
    modeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    modeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.neutralSoft,
      borderRadius: 24,
      padding: 5,
    },
    modeActive: {
      minHeight: 34,
      paddingHorizontal: 15,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primaryStrong,
    },
    modeActiveText: {
      color: theme.colors.onBrand,
      fontSize: 16,
      fontWeight: '500',
    },
    mode: {
      minHeight: 34,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceRaised,
    },
    modeText: { color: theme.colors.text, fontSize: 16, fontWeight: '500' },
    flash: {
      marginLeft: 'auto',
      minHeight: 42,
      paddingHorizontal: 13,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.surfaceRaised,
    },
    cameraFrame: {
      width: '100%',
      aspectRatio: 0.94,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: '#20252D',
    },
    preview: { width: '100%', height: '100%', resizeMode: 'cover' },
    cameraEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    cameraEmptyTitle: {
      marginTop: 13,
      color: theme.colors.onBrand,
      fontSize: 19,
      fontWeight: '600',
    },
    cameraEmptyText: {
      marginTop: 5,
      color: 'rgba(255,255,255,.65)',
      textAlign: 'center',
    },
    corner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: '#2672FF',
    },
    topLeft: {
      top: 28,
      left: 28,
      borderLeftWidth: 5,
      borderTopWidth: 5,
      borderTopLeftRadius: 7,
    },
    topRight: {
      top: 28,
      right: 28,
      borderRightWidth: 5,
      borderTopWidth: 5,
      borderTopRightRadius: 7,
    },
    bottomLeft: {
      bottom: 28,
      left: 28,
      borderLeftWidth: 5,
      borderBottomWidth: 5,
      borderBottomLeftRadius: 7,
    },
    bottomRight: {
      bottom: 28,
      right: 28,
      borderRightWidth: 5,
      borderBottomWidth: 5,
      borderBottomRightRadius: 7,
    },
    detected: {
      position: 'absolute',
      top: 22,
      alignSelf: 'center',
      minHeight: 37,
      paddingHorizontal: 16,
      borderRadius: 19,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(14,25,49,.9)',
    },
    greenDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.success,
    },
    detectedText: { color: theme.colors.onBrand, fontWeight: '600' },
    scanLine: {
      position: 'absolute',
      top: '52%',
      left: 55,
      right: 55,
      height: 3,
      backgroundColor: theme.colors.cyan,
      shadowColor: theme.colors.cyan,
      shadowOpacity: 0.8,
      shadowRadius: 12,
    },
    hint: {
      minHeight: 57,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceRaised,
    },
    analyzing: {
      minHeight: 52,
      paddingHorizontal: 15,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: theme.colors.primarySoft,
    },
    analyzingText: { color: theme.colors.primaryStrong, fontWeight: '500' },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    aiIcon: {
      width: 47,
      height: 47,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    resultTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '500' },
    resultSuccessRow: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    resultSuccess: { color: theme.colors.successStrong, fontSize: 12 },
    version: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: 'hidden',
      color: theme.colors.successStrong,
      backgroundColor: theme.colors.successSoft,
      fontWeight: '600',
    },
    amountBox: {
      position: 'relative',
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceRaised,
    },
    amount: {
      color: theme.colors.text,
      fontSize: 34,
      fontWeight: '600',
      marginTop: 7,
    },
    confidence: {
      position: 'absolute',
      right: 13,
      top: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      overflow: 'hidden',
      color: theme.colors.successStrong,
      backgroundColor: theme.colors.successSoft,
      fontWeight: '500',
    },
    resultGrid: { flexDirection: 'row', gap: 10 },
    resultItem: {
      flex: 1,
      minHeight: 96,
      padding: 13,
      gap: 9,
      borderRadius: 15,
      backgroundColor: theme.colors.surfaceRaised,
    },
    merchant: {
      minHeight: 70,
      padding: 13,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.colors.surfaceRaised,
    },
    resultActions: { flexDirection: 'row', gap: 9 },
    captureBar: {
      minHeight: 100,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
    },
    captureSide: { flex: 1, alignItems: 'center', gap: 12, paddingTop: 20 },
    captureSideText: { color: theme.colors.text, fontSize: 12 },
    captureMain: { flex: 1.25, marginTop: -4, alignItems: 'center', gap: 6 },
    captureCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryStrong,
      borderWidth: 7,
      borderColor: theme.colors.primarySoft,
    },
    captureMainText: { color: theme.colors.primaryStrong, fontWeight: '600' },
  });
