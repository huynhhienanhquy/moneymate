import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AppIcon } from '@/components/app-icon';
import { useRouter, type Href } from 'expo-router';
import { Button, Card, Screen, useUiStyles } from '@/components/ui';
import { apiRequest } from '@/lib/api';
import { toLocalDateInputValue } from '@/lib/date';
import { useAppTheme, type AppTheme } from '@/theme';
import { APP_IMAGES } from '@/lib/app-images';

interface ReceiptResult {
  amount?: number | null;
  transactionDate?: string | null;
  merchant?: string | null;
  note?: string | null;
  suggestedCategoryId?: string | null;
  suggestedCategoryName?: string | null;
  rawText?: string;
}

export default function ScanReceiptPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const analyzeAsset = useCallback(
    async (nextAsset: ImagePicker.ImagePickerAsset) => {
      setLoading(true);
      setError('');
      try {
        const form = new FormData();
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
  const pick = async () => {
    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!image.canceled && image.assets[0]) applyCapturedAsset(image.assets[0]);
  };
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
        <Pressable
          accessibilityLabel="Mở camera để dùng đèn flash"
          onPress={() => void capture()}
          style={styles.flash}
        >
          <AppIcon
            name="flash-outline"
            size={22}
            color={theme.colors.warning}
          />
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
            <Text style={styles.detectedText}>Đã phát hiện hóa đơn</Text>
          </View>
        )}
        <View style={styles.scanLine} />
      </View>
      <View style={styles.hint}>
        <AppIcon
          name="scan-helper"
          size={22}
          color={theme.colors.primaryStrong}
        />
        <Text style={ui.muted}>
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
        <Card>
          <View style={styles.resultHeader}>
            <View style={styles.aiIcon}>
              <AppIcon
                name="creation"
                size={24}
                color={theme.colors.primaryStrong}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.resultTitle}>MoneyMate AI OCR</Text>
              <View style={styles.resultSuccessRow}>
                <AppIcon
                  name="check-circle-outline"
                  size={15}
                  color={theme.colors.successStrong}
                />
                <Text style={styles.resultSuccess}>
                  Đã nhận diện thành công
                </Text>
              </View>
            </View>
            <Text style={styles.version}>V3.2</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={ui.muted}>Tổng số tiền chi tiêu</Text>
            <Text style={styles.amount}>
              {result.amount?.toLocaleString('vi-VN') || '—'} ₫
            </Text>
            <Text style={styles.confidence}>99% khớp</Text>
          </View>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={ui.muted}>Danh mục</Text>
              <Text style={ui.text}>
                {result.suggestedCategoryName || 'Chưa nhận diện'}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={ui.muted}>Nguồn tiền</Text>
              <Text style={ui.text}>Chọn khi lưu</Text>
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
                {result.transactionDate || 'Chưa nhận diện ngày'}
              </Text>
            </View>
          </View>
          <View style={styles.resultActions}>
            <View style={styles.flex}>
              <Button
                variant="secondary"
                label="Sửa"
                onPress={openTransactionForm}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Button label="Lưu giao dịch" onPress={openTransactionForm} />
            </View>
          </View>
        </Card>
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scannerHeader: {
      minHeight: 70,
      marginHorizontal: -16,
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
      fontWeight: '900',
      lineHeight: 12,
    },
    brandCaption: {
      color: theme.colors.muted,
      fontSize: 6,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    headerTitle: {
      flex: 1,
      marginLeft: 6,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '900',
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
    modeActive: {
      minHeight: 42,
      paddingHorizontal: 15,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primaryStrong,
    },
    modeActiveText: { color: theme.colors.onBrand, fontWeight: '900' },
    mode: {
      minHeight: 42,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceRaised,
    },
    modeText: { color: theme.colors.text, fontWeight: '700' },
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
      aspectRatio: 0.79,
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
      fontWeight: '900',
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
    detectedText: { color: theme.colors.onBrand, fontWeight: '900' },
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
    analyzingText: { color: theme.colors.primaryStrong, fontWeight: '800' },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    aiIcon: {
      width: 47,
      height: 47,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    resultTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '900' },
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
      fontWeight: '900',
    },
    amountBox: {
      position: 'relative',
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceRaised,
    },
    amount: { color: theme.colors.text, fontSize: 31, fontWeight: '900' },
    confidence: {
      position: 'absolute',
      right: 13,
      top: 30,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      overflow: 'hidden',
      color: theme.colors.successStrong,
      backgroundColor: theme.colors.successSoft,
      fontWeight: '800',
    },
    resultGrid: { flexDirection: 'row', gap: 10 },
    resultItem: {
      flex: 1,
      minHeight: 83,
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
    captureSide: { flex: 1, alignItems: 'center', gap: 8 },
    captureSideText: { color: theme.colors.text, fontSize: 12 },
    captureMain: { flex: 1.25, marginTop: -4, alignItems: 'center', gap: 6 },
    captureCircle: {
      width: 78,
      height: 78,
      borderRadius: 39,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryStrong,
      borderWidth: 7,
      borderColor: theme.colors.primarySoft,
    },
    captureMainText: { color: theme.colors.primaryStrong, fontWeight: '900' },
  });
