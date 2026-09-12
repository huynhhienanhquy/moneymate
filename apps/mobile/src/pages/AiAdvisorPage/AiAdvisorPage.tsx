import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Card, ProgressBar, Screen, SectionTitle, StateMessage, ui } from '@/components/ui';
import { useMobileChatbot } from '@/components/mobile-chatbot';
import { apiRequest } from '@/lib/api';
import { theme } from '@/theme';

interface Advisor {
  healthScore?: number;
  aiAdvice?: string;
  recommendations?: {
    id: string;
    priority: string;
    title: string;
    description: string;
    action: string;
    potentialSaving?: number;
  }[];
}

interface Analysis {
  aiSummary?: string;
  summary?: { monthlyIncome: number; monthlyExpense: number; savingsRate: number };
  insights?: { id: string; type: string; title: string; message: string }[];
}

interface Forecast {
  summary?: string;
  forecasts?: { categoryId: string | null; severity: string; message: string }[];
}

export default function AiAdvisorPage() {
  const { openChatbot } = useMobileChatbot();
  const advisor = useQuery({
    queryKey: ['ai-advisor'],
    queryFn: () => apiRequest<Advisor>('/ai/advisor/insights'),
  });
  const analysis = useQuery({
    queryKey: ['ai-analysis'],
    queryFn: () => apiRequest<Analysis>('/ai/analyze/expenses'),
  });
  const forecast = useQuery({
    queryKey: ['ai-forecast'],
    queryFn: () => apiRequest<Forecast>('/ai/budget/forecast'),
  });
  const score = advisor.data?.healthScore || 0;
  const loading = advisor.isLoading || analysis.isLoading || forecast.isLoading;

  return (
    <Screen title="AI Tài chính">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mở chatbot MoneyMate AI"
        onPress={openChatbot}
        style={({ pressed }) => [styles.chatCta, pressed && styles.pressed]}
      >
        <View style={styles.chatIcon}>
          <MaterialCommunityIcons name="message-processing" size={27} color="#fff" />
        </View>
        <View style={styles.chatCopy}>
          <Text style={styles.chatTitle}>Chatbot MoneyMate</Text>
          <Text style={styles.chatCaption}>Hỏi nhanh về chi tiêu, ngân sách và mục tiêu của bạn</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={25} color={theme.colors.primaryStrong} />
      </Pressable>

      {loading && <StateMessage loading message="AI đang phân tích dữ liệu…" />}

      <Card>
        <View style={ui.between}>
          <View style={styles.scoreIcon}>
            <MaterialCommunityIcons name="brain" size={27} color={theme.colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={ui.muted}>ĐIỂM SỨC KHỎE TÀI CHÍNH</Text>
            <Text style={styles.score}>
              {score}<Text style={styles.scoreTotal}> / 100</Text>
            </Text>
          </View>
        </View>
        <ProgressBar value={score} tone={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger'} />
      </Card>

      <Card>
        <View style={ui.row}>
          <MaterialCommunityIcons name="creation" size={21} color={theme.colors.violet} />
          <Text style={ui.heading}>Tóm tắt AI</Text>
        </View>
        <Text style={ui.muted}>
          {advisor.data?.aiAdvice || analysis.data?.aiSummary || 'Chưa đủ dữ liệu để đưa ra tóm tắt.'}
        </Text>
      </Card>

      {analysis.data?.insights?.length ? (
        <>
          <SectionTitle title="Phân tích chi tiêu" />
          {analysis.data.insights.map((item) => (
            <Card key={item.id}>
              <View style={ui.row}>
                <Badge label={item.type || 'Thông tin'} tone={item.type === 'warning' ? 'warning' : 'info'} />
                <Text style={[ui.text, styles.flex]}>{item.title}</Text>
              </View>
              <Text style={ui.muted}>{item.message}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {forecast.data?.forecasts?.length ? (
        <>
          <SectionTitle title="Dự đoán ngân sách" />
          {forecast.data.forecasts
            .filter((item) => item.severity !== 'OK')
            .map((item) => (
              <Card key={item.categoryId ?? 'global'}>
                <View style={ui.row}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={20}
                    color={item.severity === 'CRITICAL' ? theme.colors.danger : theme.colors.warning}
                  />
                  <Text style={[ui.muted, styles.flex]}>{item.message}</Text>
                </View>
              </Card>
            ))}
        </>
      ) : null}

      {advisor.data?.recommendations?.length ? (
        <>
          <SectionTitle title="Lời khuyên tài chính" />
          {advisor.data.recommendations.map((item) => (
            <Card key={item.id}>
              <View style={ui.row}>
                <Badge
                  label={item.priority === 'high' ? 'Cao' : item.priority === 'medium' ? 'TB' : 'Thấp'}
                  tone={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'neutral'}
                />
                <Text style={[ui.text, styles.flex]}>{item.title}</Text>
              </View>
              <Text style={ui.muted}>{item.description}</Text>
              <Text style={[ui.text, styles.action]}>→ {item.action}</Text>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  chatCta: {
    minHeight: 92,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C7E5FF',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  chatIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryStrong,
  },
  chatCopy: { flex: 1, gap: 3 },
  chatTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  chatCaption: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  scoreIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  score: { color: theme.colors.primaryStrong, fontSize: 34, fontWeight: '900' },
  scoreTotal: { color: theme.colors.muted, fontSize: 14 },
  action: { color: theme.colors.primaryStrong },
});
