import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type AppearanceMode = 'system' | 'light' | 'dark';
type AccentColor = 'rose' | 'plum' | 'peach' | 'mint';

const modes: {
  key: AppearanceMode;
  title: string;
  copy: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'system',
    title: 'Use system setting',
    copy: 'Follow your phone’s light or dark mode automatically.',
    icon: 'phone-portrait-outline',
  },
  {
    key: 'light',
    title: 'Light mode',
    copy: 'Keep Preggy bright, soft, and airy.',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    title: 'Dark mode',
    copy: 'Use a calmer low-light interface.',
    icon: 'moon-outline',
  },
];

const accents: {
  key: AccentColor;
  title: string;
  hex: string;
}[] = [
  { key: 'rose', title: 'Rose', hex: '#CE6F79' },
  { key: 'plum', title: 'Plum', hex: '#8B5A7A' },
  { key: 'peach', title: 'Peach', hex: '#F0A06B' },
  { key: 'mint', title: 'Mint', hex: '#7BBE99' },
];

function modeLabel(mode: AppearanceMode) {
  if (mode === 'system') return 'System';
  if (mode === 'dark') return 'Dark';
  return 'Light';
}

export default function AppearanceScreen() {
  const { mode, accentColor, palette, setMode, setAccentColor } = useAppTheme();
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  };

  return (
    <Screen bottomSpace={40}>
      <Header title="Appearance" back />

      <Animated.View style={animatedStyle}>
        <View style={[styles.hero, { backgroundColor: palette.accent }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="color-palette-outline" size={35} color={palette.onAccent} />
            </View>

            <View style={styles.currentPill}>
              <Text style={styles.currentPillText}>{modeLabel(mode)}</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>APP STYLE</Text>
          <Text style={styles.title}>Personalize Preggy</Text>
          <Text style={styles.subtitle}>
            Choose the theme and accent color that makes your pregnancy journey feel calm and personal.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.ink }]}>Theme mode</Text>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          {modes.map((item) => {
            const selected = mode === item.key;

            return (
              <AnimatedPressable
                key={item.key}
                onPress={() => setMode(item.key)}
                style={[styles.modeRow, selected && { backgroundColor: palette.accentSoft }]}
              >
                <View style={[styles.modeIcon, { backgroundColor: selected ? palette.accent : palette.softSurface }]}>
                  <Ionicons name={item.icon} size={22} color={selected ? palette.onAccent : palette.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text>
                  <Text style={[styles.rowCopy, { color: palette.text }]}>{item.copy}</Text>
                </View>

                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={selected ? palette.accent : palette.muted}
                />
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: palette.ink }]}>Accent color</Text>

        <View style={[styles.accentCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          {accents.map((item) => {
            const selected = accentColor === item.key;

            return (
              <AnimatedPressable
                key={item.key}
                onPress={() => setAccentColor(item.key)}
                style={[
                  styles.accentOption,
                  selected && {
                    backgroundColor: palette.accentSoft,
                    borderColor: palette.accent,
                  },
                ]}
              >
                <View style={[styles.accentCircle, { backgroundColor: item.hex }]}>
                  {selected ? <Ionicons name="checkmark" size={22} color="#FFFFFF" /> : null}
                </View>

                <Text style={[styles.accentText, { color: selected ? palette.accent : palette.ink }]}>
                  {item.title}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={[styles.preview, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={[styles.previewLabel, { color: palette.accent }]}>LIVE PREVIEW</Text>
              <Text style={[styles.previewTitle, { color: palette.ink }]}>Your Preggy theme</Text>
            </View>

            <View style={[styles.previewBadge, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.previewBadgeText, { color: palette.accent }]}>
                {accentColor}
              </Text>
            </View>
          </View>

          <View style={[styles.previewMiniScreen, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <View style={[styles.previewHeroCard, { backgroundColor: palette.accent }]}>
              <View style={styles.previewAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.previewLineStrong} />
                <View style={styles.previewLineSoft} />
              </View>
            </View>

            <View style={styles.previewRows}>
              <View style={[styles.previewRow, { backgroundColor: palette.surface, borderColor: palette.line }]}>
                <View style={[styles.previewDot, { backgroundColor: palette.accentSoft }]} />
                <View style={[styles.previewTextLine, { backgroundColor: palette.accentSoft }]} />
              </View>

              <View style={[styles.previewRow, { backgroundColor: palette.surface, borderColor: palette.line }]}>
                <View style={[styles.previewDot, { backgroundColor: palette.accentSoft }]} />
                <View style={[styles.previewTextLineShort, { backgroundColor: palette.accentSoft }]} />
              </View>
            </View>
          </View>

          <Text style={[styles.previewCopy, { color: palette.text }]}>
            {modeLabel(mode)} mode • {accentColor} accent
          </Text>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 16,
    borderRadius: 34,
    padding: 24,
    minHeight: 255,
    justifyContent: 'center',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  currentPillText: {
    ...type.small,
    color: '#fff',
    fontWeight: '900',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    color: '#fff',
    fontSize: 32,
    lineHeight: 37,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    lineHeight: 23,
  },
  sectionTitle: {
    ...type.section,
    marginBottom: 10,
    marginTop: 22,
  },
  card: {
    borderRadius: 28,
    padding: 8,
    borderWidth: 1,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 22,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  rowCopy: {
    ...type.small,
    marginTop: 3,
    lineHeight: 19,
    fontWeight: '700',
  },
  accentCard: {
    borderRadius: 28,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    gap: 8,
  },
  accentOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accentCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentText: {
    ...type.tiny,
    fontWeight: '900',
  },
  preview: {
    borderRadius: 30,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    ...type.section,
  },
  previewTitle: {
    ...type.title,
    fontSize: 24,
    marginTop: 3,
  },
  previewBadge: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  previewBadgeText: {
    ...type.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewMiniScreen: {
    marginTop: 16,
    borderRadius: 26,
    borderWidth: 1,
    padding: 14,
  },
  previewHeroCard: {
    minHeight: 88,
    borderRadius: 24,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  previewLineStrong: {
    width: '76%',
    height: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  previewLineSoft: {
    width: '54%',
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.38)',
    marginTop: 9,
  },
  previewRows: {
    gap: 10,
    marginTop: 12,
  },
  previewRow: {
    minHeight: 54,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewDot: {
    width: 30,
    height: 30,
    borderRadius: 12,
  },
  previewTextLine: {
    width: '58%',
    height: 10,
    borderRadius: 999,
  },
  previewTextLineShort: {
    width: '42%',
    height: 10,
    borderRadius: 999,
  },
  previewCopy: {
    ...type.small,
    marginTop: 12,
    fontWeight: '800',
  },
});
