import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BagSection = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  items: string[];
};

const sections: BagSection[] = [
  {
    title: 'For Mom',
    icon: 'woman-outline',
    tint: '#FADCE2',
    items: ['Birth plan', 'Comfortable clothes', 'Toiletries', 'Nursing bra', 'Phone charger'],
  },
  {
    title: 'For Baby',
    icon: 'happy-outline',
    tint: '#E4E1FF',
    items: ['Car seat installed', 'Going-home outfit', 'Swaddle blankets', 'Diapers and wipes'],
  },
  {
    title: 'For Partner',
    icon: 'people-outline',
    tint: '#FFE7D7',
    items: ['Change of clothes', 'Snacks', 'Camera', 'Pillow'],
  },
];

const initialChecked = ['Birth plan', 'Comfortable clothes', 'Car seat installed', 'Diapers and wipes', 'Camera'];

export default function HospitalBagScreen() {
  const { palette } = useAppTheme();
  const [checked, setChecked] = useState<string[]>(initialChecked);
  const allItems = useMemo(() => sections.flatMap((section) => section.items), []);
  const progress = Math.round((checked.length / allItems.length) * 100);

  function toggle(item: string) {
    setChecked((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  }

  return (
    <Screen bottomSpace={44}>
      <Header title="Hospital Bag" back />

      <View style={styles.hero}>
        <Image source={require('../../assets/images/tips-bag-baby.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient colors={['rgba(43,24,29,0.08)', 'rgba(43,24,29,0.72)']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.heroText}>
          <Text style={styles.kicker}>BIRTH PREP</Text>
          <Text style={styles.heroTitle}>Pack calmly for the big day</Text>
          <Text style={styles.heroCopy}>A simple checklist for mom, baby, and your support person.</Text>
        </View>
      </View>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.progressTop}>
          <View>
            <Text style={[styles.progressTitle, { color: palette.ink }]}>Packing progress</Text>
            <Text style={[styles.progressCopy, { color: palette.text }]}>{progress >= 100 ? 'Everything is ready!' : 'Keep going, you are nearly there.'}</Text>
          </View>

          <View style={[styles.percentBadge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.percentText, { color: palette.onAccent }]}>{progress}%</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: palette.accent }]} />
        </View>

        <Text style={[styles.count, { color: palette.muted }]}>{checked.length} of {allItems.length} essentials packed</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={section.icon} size={22} color={palette.accent} />
            </View>

            <Text style={[styles.sectionTitle, { color: palette.ink }]}>{section.title}</Text>
          </View>

          <View style={[styles.list, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            {section.items.map((item, index) => {
              const isChecked = checked.includes(item);

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => toggle(item)}
                  style={[styles.item, index < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.line }]}
                >
                  <View style={[styles.checkbox, { borderColor: palette.muted }, isChecked && { backgroundColor: palette.accent, borderColor: palette.accent }]}>
                    {isChecked && <Ionicons name="checkmark" size={18} color={palette.onAccent} />}
                  </View>

                  <Text style={[styles.itemText, { color: isChecked ? palette.text : palette.ink }]}>{item}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      ))}

      <AnimatedPressable onPress={() => setChecked(allItems)} style={[styles.completeButton, { backgroundColor: palette.accent }]}>
        <Ionicons name="checkmark-done" size={21} color={palette.onAccent} />
        <Text style={[styles.completeText, { color: palette.onAccent }]}>Mark everything packed</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 285,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  heroText: {
    padding: 24,
  },
  kicker: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  heroTitle: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    color: '#fff',
    marginTop: 7,
  },
  heroCopy: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    maxWidth: 310,
  },
  progressCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
  },
  progressTitle: {
    ...type.title,
    fontSize: 24,
    color: colors.ink,
  },
  progressCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    fontWeight: '800',
  },
  percentBadge: {
    width: 62,
    height: 62,
    borderRadius: 23,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    ...type.bodyStrong,
    color: '#fff',
    fontSize: 18,
  },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    marginTop: 18,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CE6F79',
  },
  count: {
    ...type.tiny,
    color: colors.muted,
    marginTop: 9,
    fontWeight: '900',
  },
  section: {
    marginTop: 24,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...type.title,
    fontSize: 25,
    color: colors.ink,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  item: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  checkbox: {
    width: 30,
    height: 26,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#CE6F79',
    borderColor: '#CE6F79',
  },
  itemText: {
    ...type.body,
    color: colors.ink,
  },
  itemTextChecked: {
    color: colors.text,
  },
  completeButton: {
    marginTop: 24,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  completeText: {
    ...type.bodyStrong,
    color: '#fff',
  },
});
