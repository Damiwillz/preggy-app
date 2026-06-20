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
    text: 'Hello, Mama! I’m Preggy AI. Ask me anything about symptoms, baby growth, food, appointments, or pregnancy wellness.',
  },
];

export default function PreggyAIChatScreen() {
  const [messages, setMessages] = useState<Message[]>(starter);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const suggestions = useMemo(
    () => ['Is this safe to eat?', 'Common symptoms', 'Baby growth update', 'Kick counts'],
    []
  );

  useEffect(() => {
    let mounted = true;

    getMyProfile()
      .then((data) => {
        if (mounted) {
          setProfile(data);
        }
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

      if (error) {
        throw error;
      }

      const answer =
        typeof data?.answer === 'string' && data.answer.trim()
          ? data.answer.trim()
          : 'I am here with you. Could you tell me a little more about what you are feeling?';

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
            'Preggy AI could not respond right now. Please check your connection and try again. For urgent pregnancy symptoms, contact your maternity care team immediately.',
        },
      ]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <AnimatedPressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color="#5E4A50" />
          </AnimatedPressable>

          <Image source={require('../assets/images/profile-avatar.jpg')} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Preggy AI</Text>

            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.online}>Online & Supportive</Text>
            </View>
          </View>

          <Ionicons name="notifications-outline" size={25} color="#68575B" />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.today}>Today</Text>

          {messages.map((message, index) => (
            <View
              key={message.id}
              style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.aiBubble]}
            >
              <Text style={[styles.message, message.role === 'user' && { color: '#FFF' }]}>
                {message.text}
              </Text>

              {index === 0 && <Text style={styles.time}>Now</Text>}
            </View>
          ))}

          {sending && (
            <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#755B63" />
              <Text style={styles.typingText}>Preggy AI is thinking...</Text>
            </View>
          )}

          <View style={styles.guide}>
            <Image source={require('../assets/images/tips-yoga-hero.jpg')} style={styles.guideImage} />

            <View style={styles.readBadge}>
              <Text style={styles.readBadgeText}>5 MIN READ</Text>
            </View>

            <View style={styles.guideBody}>
              <Text style={styles.guideTitle}>5 Safe Stretches for Back Pain</Text>
              <Text style={styles.guideCopy}>
                Gentle movements approved by physical therapists to alleviate pressure during pregnancy.
              </Text>

              <AnimatedPressable onPress={() => router.push('/tips/yoga')}>
                <Text style={styles.guideLink}>Read Guide →</Text>
              </AnimatedPressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.suggestions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionContent}>
            {suggestions.map((suggestion) => (
              <AnimatedPressable key={suggestion} onPress={() => send(suggestion)} style={styles.chip}>
                <Text style={styles.chipText}>{suggestion}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <Ionicons name="happy-outline" size={24} color="#9B8C8F" />

            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              placeholder="Ask Preggy AI anything…"
              placeholderTextColor="#A79A9D"
              style={styles.input}
              multiline
              editable={!sending}
            />

            <Ionicons name="attach-outline" size={22} color="#9B8C8F" />
          </View>

          <AnimatedPressable onPress={() => send()} style={[styles.send, sending && styles.sendDisabled]}>
            {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={22} color="#FFF" />}
          </AnimatedPressable>
        </View>

        <View style={styles.nav}>
          {[
            ['calendar-outline', 'Today'],
            ['bar-chart-outline', 'Insights'],
            ['sparkles', 'AI Chat'],
            ['medkit-outline', 'Care'],
          ].map(([icon, label]) => (
            <View key={label} style={[styles.navItem, label === 'AI Chat' && styles.navActive]}>
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={label === 'AI Chat' ? '#72515D' : '#75696C'}
              />
              <Text style={[styles.navText, label === 'AI Chat' && styles.navTextActive]}>{label}</Text>
            </View>
          ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  header: {
    height: 64,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E6E2',
  },
  back: {
    width: 34,
    height: 42,
    justifyContent: 'center',
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
  },
  title: {
    ...type.bodyStrong,
    color: '#493D40',
    fontSize: 17,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8ED8A3',
  },
  online: {
    ...type.small,
    color: '#8D7F82',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 17,
    paddingBottom: 22,
  },
  today: {
    ...type.small,
    alignSelf: 'center',
    backgroundColor: '#F4EFED',
    color: '#706367',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 15,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 22,
    padding: 17,
    marginBottom: 12,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#765F65',
  },
  message: {
    ...type.body,
    color: '#2E2528',
    lineHeight: 23,
  },
  time: {
    ...type.tiny,
    color: '#857679',
    marginTop: 9,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    ...type.small,
    color: '#706367',
  },
  guide: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 2,
  },
  guideImage: {
    width: '100%',
    height: 120,
  },
  readBadge: {
    position: 'absolute',
    top: 91,
    right: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  readBadgeText: {
    ...type.tiny,
    color: '#59494E',
  },
  guideBody: {
    padding: 14,
  },
  guideTitle: {
    ...type.bodyStrong,
    color: '#302629',
    fontSize: 17,
  },
  guideCopy: {
    ...type.small,
    color: '#6D6063',
    lineHeight: 18,
    marginTop: 3,
  },
  guideLink: {
    ...type.bodyStrong,
    color: '#725960',
    marginTop: 9,
  },
  suggestions: {
    height: 48,
    justifyContent: 'center',
  },
  suggestionContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EFE4E1',
  },
  chipText: {
    ...type.small,
    color: '#5E5054',
  },
  composer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0E4E0',
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 90,
    backgroundColor: '#F4EFED',
    borderRadius: 24,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    ...type.body,
    color: '#3D3235',
    paddingVertical: 11,
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#755B63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.7,
  },
  nav: {
    height: 66,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFE4E0',
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 72,
    paddingVertical: 7,
    borderRadius: 22,
  },
  navActive: {
    backgroundColor: '#FFE2E7',
  },
  navText: {
    ...type.tiny,
    color: '#76696C',
  },
  navTextActive: {
    color: '#72515D',
    fontWeight: '700',
  },
});
