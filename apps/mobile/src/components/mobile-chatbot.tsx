import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { theme } from '@/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply?: string;
  message?: string;
  suggestions?: string[];
}

interface MobileChatbotContextValue {
  openChatbot: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'Tháng này tôi chi nhiều nhất ở đâu?',
  'Tôi có vượt ngân sách không?',
  'Tỷ lệ tiết kiệm của tôi thế nào?',
];

const MobileChatbotContext = createContext<MobileChatbotContextValue>({
  openChatbot: () => undefined,
});

export function useMobileChatbot() {
  return useContext(MobileChatbotContext);
}

export function MobileChatbotProvider({ children }: PropsWithChildren) {
  const userId = useAuthStore((state) => state.user?.id);
  const [openForUserId, setOpenForUserId] = useState<string | null>(null);
  const openChatbot = useCallback(() => {
    if (userId) setOpenForUserId(userId);
  }, [userId]);
  const open = Boolean(userId && openForUserId === userId);

  return (
    <MobileChatbotContext.Provider value={{ openChatbot }}>
      {children}
      {userId && (
        <MobileChatbot
          key={userId}
          open={open}
          onOpenChange={(nextOpen) => setOpenForUserId(nextOpen ? userId : null)}
        />
      )}
    </MobileChatbotContext.Provider>
  );
}

function MobileChatbot({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const send = useCallback(async (candidate?: string) => {
    const text = (candidate ?? input).trim();
    if (!text || sending) return;

    const previousMessages = messages;
    const userMessage: ChatMessage = {
      id: Crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    setMessages([...previousMessages, userMessage]);
    setInput('');
    setErrorMessage(null);
    setSending(true);

    try {
      const response = await apiRequest<ChatResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: previousMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const assistantMessage: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'assistant',
        content: response.reply || response.message || 'Mình đã nhận câu hỏi của bạn.',
      };
      setMessages((items) => [...items, assistantMessage]);
      if (response.suggestions?.length) {
        setSuggestions(response.suggestions.slice(0, 4));
      }
    } catch (error) {
      setMessages((items) => items.filter((item) => item.id !== userMessage.id));
      setInput(text);
      setErrorMessage(error instanceof Error ? error.message : 'Không thể kết nối MoneyMate AI.');
    } finally {
      setSending(false);
    }
  }, [input, messages, sending]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mở chatbot MoneyMate AI"
        onPress={() => onOpenChange(true)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom, 14) + 14 },
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="message-processing" size={27} color="#fff" />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => onOpenChange(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.header}>
              <View style={styles.assistantIcon}>
                <MaterialCommunityIcons name="creation" size={22} color="#fff" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>MoneyMate AI</Text>
                <Text style={styles.subtitle}>Trợ lý tài chính cá nhân</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng chatbot"
                onPress={() => onOpenChange(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="close" size={23} color={theme.colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && (
                <View style={styles.welcome}>
                  <View style={styles.welcomeIcon}>
                    <MaterialCommunityIcons name="robot-happy-outline" size={32} color={theme.colors.primaryStrong} />
                  </View>
                  <Text style={styles.welcomeTitle}>Bạn muốn xem nhanh điều gì?</Text>
                  <Text style={styles.welcomeText}>
                    Mình có thể phân tích chi tiêu, ngân sách, mục tiêu và tỷ lệ tiết kiệm từ dữ liệu MoneyMate của bạn.
                  </Text>
                </View>
              )}

              {messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.bubble,
                    item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text style={item.role === 'user' ? styles.userMessage : styles.assistantMessage}>
                    {item.content}
                  </Text>
                </View>
              ))}

              {sending && (
                <View style={[styles.bubble, styles.assistantBubble, styles.typing]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.typingText}>Đang phân tích…</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.composerArea}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestions}
                keyboardShouldPersistTaps="handled"
              >
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    disabled={sending}
                    onPress={() => void send(suggestion)}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {errorMessage && (
                <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                  {errorMessage}
                </Text>
              )}

              <View style={styles.composer}>
                <TextInput
                  accessibilityLabel="Câu hỏi cho MoneyMate AI"
                  value={input}
                  onChangeText={setInput}
                  placeholder="Hỏi về tài chính của bạn…"
                  placeholderTextColor={theme.colors.muted}
                  multiline
                  maxLength={1000}
                  editable={!sending}
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Gửi câu hỏi"
                  accessibilityState={{ disabled: !input.trim() || sending, busy: sending }}
                  disabled={!input.trim() || sending}
                  onPress={() => void send()}
                  style={({ pressed }) => [
                    styles.sendButton,
                    (!input.trim() || sending) && styles.sendButtonDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <MaterialCommunityIcons name="send" size={20} color="#fff" />}
                </Pressable>
              </View>
              <Text style={styles.disclaimer}>
                Thông tin chỉ mang tính tham khảo, không thay thế tư vấn tài chính chuyên nghiệp.
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: theme.colors.background },
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryStrong,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: theme.colors.primaryStrong,
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  pressed: { opacity: 0.68 },
  header: {
    minHeight: 74,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  assistantIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryStrong,
  },
  headerCopy: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, padding: 16, gap: 11 },
  welcome: { flex: 1, minHeight: 230, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  welcomeTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  welcomeText: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  bubble: { maxWidth: '88%', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.primaryStrong, borderBottomRightRadius: 6 },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 6,
  },
  userMessage: { color: '#fff', fontSize: 15, lineHeight: 21 },
  assistantMessage: { color: theme.colors.text, fontSize: 15, lineHeight: 21 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { color: theme.colors.muted, fontSize: 13 },
  composerArea: {
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 9,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  suggestions: { gap: 8, paddingRight: 14 },
  suggestion: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 99,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#C7E5FF',
  },
  suggestionText: { color: theme.colors.primaryStrong, fontSize: 12, fontWeight: '700' },
  errorText: { color: theme.colors.danger, fontSize: 12, lineHeight: 17 },
  composer: {
    minHeight: 52,
    maxHeight: 116,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    padding: 5,
    paddingLeft: 14,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: { flex: 1, minHeight: 40, maxHeight: 96, color: theme.colors.text, fontSize: 15, paddingVertical: 9 },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryStrong,
  },
  sendButtonDisabled: { opacity: 0.42 },
  disclaimer: { color: theme.colors.subtle, fontSize: 10, lineHeight: 14, textAlign: 'center' },
});
