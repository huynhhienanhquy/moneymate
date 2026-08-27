import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Screen, ui } from '@/components/ui';
import { apiRequest } from '@/lib/api';

interface ReceiptResult { amount?: number; date?: string; merchant?: string; category?: string; rawText?: string }

export default function ScanReceiptPage() {
  const [uri, setUri] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const capture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { setError('Cần quyền camera để quét hóa đơn.'); return; }
    const image = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.65, allowsEditing: true });
    if (!image.canceled) { setUri(image.assets[0].uri); setResult(null); setError(''); }
  };

  const scan = async () => {
    if (!uri) return;
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', { uri, name: 'receipt.jpg', type: 'image/jpeg' } as unknown as Blob);
      setResult(await apiRequest<ReceiptResult>('/ai/receipt/scan', { method: 'POST', body: form }));
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Không thể quét hóa đơn');
    } finally { setLoading(false); }
  };

  return <Screen title="Quét hóa đơn">
    <Card><Text style={ui.muted}>Đặt hóa đơn trên nền phẳng, đủ sáng và giữ toàn bộ nội dung trong khung hình. Luôn kiểm tra kết quả trước khi lưu.</Text></Card>
    {uri && <Image source={{ uri }} style={styles.preview} accessibilityLabel="Ảnh hóa đơn đã chụp" />}
    <Button variant="secondary" label={uri ? 'Chụp lại' : 'Chụp hóa đơn'} onPress={capture} />
    {uri && <Button label="Phân tích hóa đơn" onPress={scan} loading={loading} />}
    {!!error && <Text accessibilityLiveRegion="polite" style={ui.negative}>{error}</Text>}
    {result && <Card><Text style={ui.heading}>Kết quả nhận diện</Text><Text style={ui.text}>Nơi bán: {result.merchant || 'Chưa nhận diện'}</Text><Text style={ui.text}>Số tiền: {result.amount?.toLocaleString('vi-VN') || '—'} ₫</Text><Text style={ui.text}>Ngày: {result.date || '—'}</Text><Text style={ui.text}>Danh mục: {result.category || '—'}</Text><Text style={ui.muted}>Hãy đối chiếu với hóa đơn trước khi tạo giao dịch.</Text></Card>}
  </Screen>;
}

const styles = StyleSheet.create({ preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: 18 } });
