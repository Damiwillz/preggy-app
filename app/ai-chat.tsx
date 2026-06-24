import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';
import { getMyProfile, type UserProfile } from '@/services/profile';

type Message = {
  id: string;
  role: 'ai' | 'user';
  text: string;
};

const starter: Message[] = [
  {
    id: 'welcome',
    role: 'ai',
    text: 'Hi Mama, I’m Preggy AI. Ask me about symptoms, food, baby growth, appointments, medication routines, or what to pack for birth.',
  },
];

export default function PreggyAIChatScreen() {
  const { palette } = useAppTheme();
  const [messages, setMessages] = useState<Message[]>(starter);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const suggestions = useMemo(
    () => [
      'Is this symptom normal?',
      'What can I eat today?',
      'Explain baby movement',
      'Help me prepare for birth',
    ],
    []
  );

  useEffect(() => {
    let mounted = true;

    getMyProfile()
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch((error) => {
        console.log('Could not load AI profile context:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function scrollToBottom() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }

  async function send(value = input) {
    const text = value.trim();

    if (!text || sending) return;

    const userMessage: Message = {
      id: `${Date.now()}u`,
      role: 'user',
      text,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setSending(true);
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke('preggy-ai', {
        body: {
          messages: nextMessages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
          pregnancyWeek: profile?.pregnancy_week ?? null,
          babyNickname: profile?.baby_nickname ?? 'your baby',
        },
      });

      if (error) throw error;

      const answer =
        typeof data?.answer === 'string' && data.answer.trim()
          ? data.answer.trim()
          : 'I’m here with you. Could you tell me a little more?';

      setMessages((old) => [
        ...old,
        {
          id: `${Date.now()}a`,
          role: 'ai',
          text: answer,
        },
      ]);
    } catch (error) {
      console.log('Preggy AI chat error:', error);

      setMessages((old) => [
        ...old,
        {
          id: `${Date.now()}e`,
          role: 'ai',
          text:
            'Preggy AI could not respond right now. Please try again later. For urgent symptoms, contact your maternity care team immediately.',
        },
      ]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: palette.line, backgroundColor: palette.canvas }]}>
          <AnimatedPressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={27} color={palette.ink} />
          </AnimatedPressable>

          <View style={[styles.aiAvatar, { backgroundColor: palette.accentSoft }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="sparkles" size={24} color={palette.accent} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: palette.ink }]}>Preggy AI</Text>

            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.online, { color: palette.text }]}>Private pregnancy support</Text>
            </View>
          </View>

          <View style={[styles.shield, { backgroundColor: palette.softSurface }]}>
            <Ionicons name="shield-checkmark-outline" size={21} color={palette.accent} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
            <View style={[styles.heroIcon, { backgroundColor: palette.accent }]}>
              <Ionicons name="sparkles" size={25} color={palette.onAccent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: palette.ink }]}>
                Ask anything, gently.
              </Text>
              <Text style={[styles.heroCopy, { color: palette.text }]}>
                Answers are personalized with your saved pregnancy profile.
              </Text>
            </View>
          </View>

          <View style={[styles.safetyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={[styles.safetyIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name="medkit-outline" size={20} color={palette.accent} />
            </View>

            <View style={styles.safetyTextWrap}>
              <Text style={[styles.safetyTitle, { color: palette.ink }]}>Wellness support only</Text>
              <Text style={[styles.safetyCopy, { color: palette.text }]}>
                Preggy AI does not replace medical advice. For urgent symptoms, contact your doctor, midwife, or emergency services.
              </Text>
            </View>
          </View>

          <Text style={[styles.today, { backgroundColor: palette.softSurface, color: palette.text }]}>Today</Text>

          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                ]}
              >
                {!isUser && (
                  <View style={[styles.miniAvatar, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name="sparkles" size={15} color={palette.accent} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: isUser ? palette.accent : palette.surface,
                      borderColor: isUser ? palette.accent : palette.line,
                    },
                    isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text style={[styles.message, { color: isUser ? palette.onAccent : palette.ink }]}>
                    {message.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {sending && (
            <View style={[styles.messageRow, { justifyContent: 'flex-start' }]}>
              <View style={[styles.miniAvatar, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="sparkles" size={15} color={palette.accent} />
              </View>

              <View style={[styles.typingBubble, { backgroundColor: palette.surface, borderColor: palette.line }]}>
                <ActivityIndicator size="small" color={palette.accent} />
                <Text style={[styles.typingText, { color: palette.text }]}>Preggy AI is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.suggestions, { borderTopColor: palette.line }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionContent}>
            {suggestions.map((suggestion) => (
              <AnimatedPressable
                key={suggestion}
                onPress={() => send(suggestion)}
                style={[styles.chip, { backgroundColor: palette.surface, borderColor: palette.line }]}
              >
                <Text style={[styles.chipText, { color: palette.ink }]}>{suggestion}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.composer, { borderTopColor: palette.line, backgroundColor: palette.canvas }]}>
          <View style={[styles.inputWrap, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={palette.muted} />

            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              placeholder="Ask Preggy AI anything..."
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.ink }]}
              multiline
              editable={!sending}
            />
          </View>

          <AnimatedPressable
            onPress={() => send()}
            style={[styles.send, { backgroundColor: palette.accent }, sending && styles.sendDisabled]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={palette.onAccent} />
            ) : (
              <Ionicons name="send" size={22} color={palette.onAccent} />
            )}
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  back: {
    width: 34,
    height: 44,
    justifyContent: 'center',
  },
  aiAvatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#81D39A',
  },
  online: {
    ...type.small,
  },
  shield: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 22,
  },
  heroCard: {
    borderRadius: 26,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    marginBottom: 15,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  today: {
    ...type.small,
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginBottom: 15,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 13,
    alignItems: 'flex-end',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
  },
  aiBubble: {
    borderBottomLeftRadius: 8,
  },
  userBubble: {
    borderBottomRightRadius: 8,
  },
  message: {
    ...type.body,
    lineHeight: 23,
  },
  typingBubble: {
    minHeight: 48,
    borderRadius: 22,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
  },
  typingText: {
    ...type.small,
  },
  suggestions: {
    height: 58,
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  suggestionContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderWidth: 1,
  },
  chipText: {
    ...type.small,
    fontWeight: '700',
  },
  composer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1,
    minHeight: 50,
    maxHeight: 96,
    borderRadius: 25,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: 11,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.7,
  },

  safetyCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
  },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTextWrap: {
    flex: 1,
  },
  safetyTitle: {
    ...type.bodyStrong,
    fontSize: 15,
    marginBottom: 4,
  },
  safetyCopy: {
    ...type.small,
    lineHeight: 19,
  },
});
