import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type SignalOption = {
  id: string;
  title: string;
  message: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type SavedSignal = {
  signalId: string;
  note: string;
  active: boolean;
  updatedAt: string;
};

const STORAGE_KEY = 'preggy:care-signal';

const signals: SignalOption[] = [
  {
    id: 'resting',
    title: 'Parent resting',
    message: 'Please keep things calm and protect this rest window.',
    icon: 'moon-outline',
  },
  {
    id: 'baby-sleeping',
    title: 'Baby sleeping',
    message: 'Please use quiet voices and avoid unnecessary interruptions.',
    icon: 'volume-mute-outline',
  },
  {
    id: 'feeding',
    title: 'Feeding now',
    message: 'We need privacy and a little uninterrupted time.',
    icon: 'restaurant-outline',
  },
  {
    id: 'welcome',
    title: 'Visitors welcome',
    message: 'We are ready for a short visit. Please check in first.',
    icon: 'people-outline',
  },
  {
    id: 'help',
    title: 'Help appreciated',
    message: 'Practical support would really help us today.',
    icon: 'heart-outline',
  },
  {
    id: 'supplies',
    title: 'Supplies needed',
    message: 'Please check with us before coming—we may need a few items.',
    icon: 'cart-outline',
  },
];

export default function CareSignalScreen() {
  const { palette } = useAppTheme();

  const [selectedId, setSelectedId] = useState('resting');
  const [note, setNote] = useState('');
  const [active, setActive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const selectedSignal = useMemo(
    () =>
      signals.find((signal) => signal.id === selectedId) ??
      signals[0],
    [selectedId]
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;

        const saved = JSON.parse(value) as SavedSignal;

        if (signals.some((signal) => signal.id === saved.signalId)) {
          setSelectedId(saved.signalId);
        }

        setNote(saved.note ?? '');
        setActive(Boolean(saved.active));
        setUpdatedAt(saved.updatedAt ?? null);
      })
      .catch((error) => {
        console.log('Care Signal load error:', error);
      });
  }, []);

  async function saveSignal(nextActive: boolean) {
    const now = new Date().toISOString();

    const data: SavedSignal = {
      signalId: selectedSignal.id,
      note: note.trim(),
      active: nextActive,
      updatedAt: now,
    };

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      setActive(nextActive);
      setUpdatedAt(now);

      Alert.alert(
        nextActive ? 'Care Signal is live' : 'Care Signal turned off',
        nextActive
          ? selectedSignal.title + ' is now your household status.'
          : 'Your household status is no longer active.'
      );
    } catch (error) {
      console.log('Care Signal save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again in a moment.'
      );
    }
  }

  async function shareSignal() {
    const lines = [
      'Preggy Care Signal',
      '',
      selectedSignal.title,
      selectedSignal.message,
      note.trim() ? '' : null,
      note.trim() ? 'Note: ' + note.trim() : null,
      '',
      'Thank you for helping us protect a calm home.',
    ].filter(Boolean) as string[];

    await Share.share({
      title: selectedSignal.title,
      message: lines.join('\n'),
    });
  }

  return (
    <Screen bottomSpace={70}>
      <Header title="Care Signal" back />

      <View
        style={[
          styles.signalBoard,
          {
            backgroundColor: active
              ? palette.accent
              : palette.accentSoft,
            borderColor: active
              ? palette.accent
              : palette.line,
          },
        ]}
      >
        <View style={styles.signalTop}>
          <View
            style={[
              styles.signalIcon,
              {
                backgroundColor: active
                  ? 'rgba(255,255,255,0.18)'
                  : palette.surface,
              },
            ]}
          >
            <Ionicons
              name={selectedSignal.icon}
              size={34}
              color={
                active
                  ? palette.onAccent
                  : palette.accent
              }
            />
          </View>

          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor: active
                  ? palette.onAccent
                  : palette.surface,
              },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: active
                    ? palette.success
                    : palette.muted,
                },
              ]}
            />
            <Text
              style={[
                styles.liveText,
                {
                  color: active
                    ? palette.accent
                    : palette.muted,
                },
              ]}
            >
              {active ? 'LIVE NOW' : 'NOT ACTIVE'}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.signalTitle,
            {
              color: active
                ? palette.onAccent
                : palette.ink,
            },
          ]}
        >
          {selectedSignal.title}
        </Text>

        <Text
          style={[
            styles.signalMessage,
            {
              color: active
                ? palette.onAccent
                : palette.text,
            },
          ]}
        >
          {selectedSignal.message}
        </Text>

        {note.trim() ? (
          <View
            style={[
              styles.notePreview,
              {
                backgroundColor: active
                  ? 'rgba(255,255,255,0.15)'
                  : palette.surface,
              },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={
                active
                  ? palette.onAccent
                  : palette.accent
              }
            />
            <Text
              style={[
                styles.notePreviewText,
                {
                  color: active
                    ? palette.onAccent
                    : palette.text,
                },
              ]}
            >
              {note.trim()}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          What does your home need?
        </Text>

        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Choose one clear signal for family, visitors and caregivers.
        </Text>

        <View style={styles.optionList}>
          {signals.map((signal) => {
            const selected = signal.id === selectedId;

            return (
              <AnimatedPressable
                key={signal.id}
                onPress={() => setSelectedId(signal.id)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected
                      ? palette.accentSoft
                      : palette.canvas,
                    borderColor: selected
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    {
                      backgroundColor: selected
                        ? palette.accent
                        : palette.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={signal.icon}
                    size={22}
                    color={
                      selected
                        ? palette.onAccent
                        : palette.muted
                    }
                  />
                </View>

                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: palette.ink },
                    ]}
                  >
                    {signal.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionMessage,
                      { color: palette.text },
                    ]}
                    numberOfLines={2}
                  >
                    {signal.message}
                  </Text>
                </View>

                <Ionicons
                  name={
                    selected
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={22}
                  color={
                    selected
                      ? palette.accent
                      : palette.muted
                  }
                />
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Add a personal note
        </Text>

        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          This appears below your household signal.
        </Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Example: Please text before knocking..."
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.noteInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          onPress={() => saveSignal(true)}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="radio-outline"
            size={21}
            color={palette.onAccent}
          />
          <Text
            style={[
              styles.primaryButtonText,
              { color: palette.onAccent },
            ]}
          >
            {active ? 'Update Care Signal' : 'Make signal live'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={shareSignal}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="share-outline"
            size={21}
            color={palette.accent}
          />
          <Text
            style={[
              styles.secondaryButtonText,
              { color: palette.ink },
            ]}
          >
            Share with family
          </Text>
        </AnimatedPressable>

        {active ? (
          <AnimatedPressable
            onPress={() => saveSignal(false)}
            style={styles.turnOffButton}
          >
            <Text style={[styles.turnOffText, { color: palette.muted }]}>
              Turn signal off
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {updatedAt ? (
        <Text style={[styles.updatedText, { color: palette.muted }]}>
          Last updated {new Date(updatedAt).toLocaleString()}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  signalBoard: {
    borderWidth: 1,
    borderRadius: 34,
    padding: 23,
    marginTop: 12,
    marginBottom: 15,
  },
  signalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  signalIcon: {
    width: 65,
    height: 65,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    minHeight: 35,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    ...type.tiny,
    letterSpacing: 0.8,
  },
  signalTitle: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 40,
  },
  signalMessage: {
    ...type.body,
    lineHeight: 23,
    marginTop: 8,
    opacity: 0.9,
  },
  notePreview: {
    borderRadius: 18,
    padding: 13,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  notePreviewText: {
    ...type.small,
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginBottom: 15,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 21,
    lineHeight: 26,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 15,
  },
  optionList: {
    gap: 9,
  },
  option: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 21,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    marginHorizontal: 11,
  },
  optionTitle: {
    ...type.bodyStrong,
  },
  optionMessage: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 2,
  },
  noteInput: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    ...type.body,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryButtonText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  turnOffButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnOffText: {
    ...type.small,
    textDecorationLine: 'underline',
  },
  updatedText: {
    ...type.tiny,
    textAlign: 'center',
    marginTop: 14,
  },
});
