import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const STORAGE_KEY = 'preggy:hospital-bag-checklist';

const bagSections = [
  {
    title: 'For mama',
    icon: 'woman-outline',
    items: [
      'Comfortable nightwear',
      'Maternity pads',
      'Nursing bra',
      'Toiletries',
      'Phone charger',
      'Going-home outfit',
    ],
  },
  {
    title: 'For baby',
    icon: 'happy-outline',
    items: [
      'Baby clothes',
      'Blanket',
      'Diapers',
      'Wipes',
      'Hat and socks',
      'Car seat ready',
    ],
  },
  {
    title: 'Documents',
    icon: 'document-text-outline',
    items: [
      'Hospital card',
      'Birth plan',
      'Insurance details',
      'Emergency contacts',
    ],
  },
] as const;

type BagItemKey = string;

function makeItemKey(sectionTitle: string, item: string) {
  return `${sectionTitle}:${item}`;
}

export default function HospitalBagChecklistScreen() {
  const { palette } = useAppTheme();
  const [packedItems, setPackedItems] = useState<BagItemKey[]>([]);

  const totalItems = useMemo(
    () => bagSections.reduce((sum, section) => sum + section.items.length, 0),
    []
  );

  const packedCount = packedItems.length;
  const progress = Math.round((packedCount / totalItems) * 100);

  useEffect(() => {
    async function loadChecklist() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setPackedItems(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Hospital bag checklist load error:', error);
      }
    }

    void loadChecklist();
  }, []);

  function toggleItem(key: BagItemKey) {
    setPackedItems((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => {
        console.log('Hospital bag checklist save error:', error);
      });

      return next;
    });
  }

  function resetChecklist() {
    setPackedItems([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
      console.log('Hospital bag checklist reset error:', error);
    });
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>BIRTH PREPARATION</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Hospital Bag</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Keep track of what you have packed for mama, baby, and hospital paperwork.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>PACKING PROGRESS</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>{progress}% ready</Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="bag-handle-outline" size={31} color={palette.onAccent} />
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
          {packedCount}/{totalItems} items packed
        </Text>

        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <AnimatedPressable
        onPress={resetChecklist}
        style={[styles.resetButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <Ionicons name="refresh-outline" size={19} color={palette.ink} />
        <Text style={[styles.resetText, { color: palette.ink }]}>Reset checklist</Text>
      </AnimatedPressable>

      {bagSections.map((section) => (
        <View
          key={section.title}
          style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={section.icon} size={23} color={palette.accent} />
            </View>

            <Text style={[styles.sectionTitle, { color: palette.ink }]}>{section.title}</Text>
          </View>

          <View style={styles.itemList}>
            {section.items.map((item) => {
              const key = makeItemKey(section.title, item);
              const packed = packedItems.includes(key);

              return (
                <AnimatedPressable
                  key={key}
                  onPress={() => toggleItem(key)}
                  style={[
                    styles.checkItem,
                    {
                      backgroundColor: packed ? palette.accentSoft : palette.canvas,
                      borderColor: packed ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: packed ? palette.accent : palette.surface,
                        borderColor: packed ? palette.accent : palette.line,
                      },
                    ]}
                  >
                    <Ionicons
                      name={packed ? 'checkmark' : 'ellipse-outline'}
                      size={18}
                      color={packed ? palette.onAccent : palette.accent}
                    />
                  </View>

                  <Text style={[styles.itemText, { color: palette.ink }]}>{item}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      ))}

      <View style={[styles.noteCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={24} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Every hospital is different. Ask your care team what they recommend bringing.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 174,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  heroTitle: {
    ...type.title,
    fontSize: 34,
    lineHeight: 39,
    marginTop: 6,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    opacity: 0.92,
  },
  heroTrack: {
    height: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    marginTop: 12,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  resetButton: {
    minHeight: 50,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetText: {
    ...type.small,
    fontWeight: '900',
  },
  sectionCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 20,
  },
  itemList: {
    gap: 10,
  },
  checkItem: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    ...type.bodyStrong,
    fontSize: 15,
    flex: 1,
  },
  noteCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
});
