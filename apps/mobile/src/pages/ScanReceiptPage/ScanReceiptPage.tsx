import { useCallback, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Screen, useUiStyles } from '@/components/ui';
import { apiRequest } from '@/lib/api';

interface ReceiptResult { amount?: number; date?: string; merchant?: string; category?: string; rawText?: string }

export default function ScanReceiptPage() {
  const ui = useUiStyles();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyCapturedAsset = useCallback((nextAsset: ImagePicker.ImagePickerAsset) => {
    setAsset(nextAsset);
    setResult(null);
    setError('');
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void ImagePicker.getPendingResultAsync().then((pending) => {
      if (!pending) return;
      if ('code' in pending) {
        setError(pending.message || 'Không thể khôi phục ảnh hóa đơn.');
      } else if (!pending.canceled && pending.assets[0]) {
        applyCapturedAsset(pending.assets[0]);
      }
    }).catch(() => undefined);
  }, [applyCapturedAsset]);

  const capture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { setError('Cần quyền camera để quét hóa đơn.'); return; }
      const image = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
      if (!image.canceled && image.assets[0]) applyCapturedAsset(image.assets[0]);
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : 'Không thể mở camera.');
    }
  };

  const scan = async () => {
    if (!asset) return;
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'receipt.jpg',
        type: asset.mimeType || 'image/jpeg'
      } as unknown as Blob);
      setResult(await apiRequest<ReceiptResult>('/ai/receipt/scan', { method: 'POST', body: form }));
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Không thể quét hóa đơn');
    } finally { setLoading(false); }
  };

  return <Screen title="Quét hóa đơn">
    <Card><Text style={ui.muted}>Đặt hóa đơn trên nền phẳng, đủ sáng và giữ toàn bộ nội dung trong khung hình. Luôn kiểm tra kết quả trước khi lưu.</Text></Card>
    {asset && <Image source={{ uri: asset.uri }} style={styles.preview} accessibilityLabel="Ảnh hóa đơn đã chụp" />}
    <Button variant="secondary" label={asset ? 'Chụp lại' : 'Chụp hóa đơn'} onPress={capture} />
    {asset && <Button label="Phân tích hóa đơn" onPress={scan} loading={loading} />}
    {!!error && <Text accessibilityLiveRegion="polite" style={ui.negative}>{error}</Text>}
    {result && <Card><Text style={ui.heading}>Kết quả nhận diện</Text><Text style={ui.text}>Nơi bán: {result.merchant || 'Chưa nhận diện'}</Text><Text style={ui.text}>Số tiền: {result.amount?.toLocaleString('vi-VN') || '—'} ₫</Text><Text style={ui.text}>Ngày: {result.date || '—'}</Text><Text style={ui.text}>Danh mục: {result.category || '—'}</Text><Text style={ui.muted}>Hãy đối chiếu với hóa đơn trước khi tạo giao dịch.</Text></Card>}
  </Screen>;
}

const styles = StyleSheet.create({ preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: 18 } });
