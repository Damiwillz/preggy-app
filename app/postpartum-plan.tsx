import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type PlanCategory = 'Recovery' | 'Baby' | 'Feeding' | 'Support';

type PlanItem = {
  id: string;
  title: string;
  copy: string;
  category: PlanCategory;
  done: boolean;
  custom?: boolean;
};

const STORAGE_KEY = 'preggy:postpartum-plan';
const categories: Array<PlanCategory | 'All'> = ['All', 'Recovery', 'Baby', 'Feeding', 'Support'];

const defaultItems: PlanItem[] = [
  { id: 'recovery-supplies', title: 'Recovery supplies', copy: 'Pads, comfortable clothes, water bottle, and pain relief plan.', category: 'Recovery', done: false },
  { id: 'followup-visit', title: 'Postpartum follow-up', copy: 'Know when your next check-in or doctor visit should happen.', category: 'Recovery', done: false },
  { id: 'warning-plan', title: 'Warning sign plan', copy: 'Know who to call if bleeding, pain, fever, mood, or blood pressure feels concerning.', category: 'Recovery', done: false },
  { id: 'baby-sleep', title: 'Baby sleep space', copy: 'Safe place for baby to sleep, close to you but separate.', category: 'Baby', done: false },
  { id: 'diapers-wipes', title: 'Diapers and wipes', copy: 'Enough basics for the first days at home.', category: 'Baby', done: false },
  { id: 'pediatrician', title: 'Pediatrician details', copy: 'Doctor name, phone number, and first baby appointment.', category: 'Baby', done: false },
  { id: 'feeding-station', title: 'Feeding station', copy: 'Water, snacks, burp cloths, bottles or nursing items.', category: 'Feeding', done: false },
  { id: 'feeding-help', title: 'Feeding support', copy: 'Lactation help, formula plan, or trusted person to call.', category: 'Feeding', done: false },
  { id: 'night-support', title: 'Night support plan', copy: 'Who helps at night, and when you can rest.', category: 'Support', done: false },
  { id: 'meal-help', title: 'Meals and errands', copy: 'Simple food plan, grocery help, laundry, and home tasks.', category: 'Support', done: false },
  { id: 'visitor-boundaries', title: 'Visitor boundaries', copy: 'Decide who can visit, when, and what help you need.', category: 'Support', done: false },
];

function parseItems(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PlanItem[]) : [];
  } catch {
    return [];
  }
}

function mergeSavedItems(savedItems: PlanItem[]) {
  const savedById = new Map(savedItems.map((item) => [item.id, item]));

  const mergedDefaults = defaultItems.map((item) => ({
    ...item,
    done: savedById.get(item.id)?.done ?? false,
  }));

  return [...mergedDefaults, ...savedItems.filter((item) => item.custom)];
}

export default function PostpartumPlanScreen() {
  const { palette } = useAppTheme();

  const [items, setItems] = useState<PlanItem[]>(defaultItems);
  const [activeCategory, setActiveCategory] = useState<PlanCategory | 'All'>('All');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    async function loadItems() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setItems(mergeSavedItems(parseItems(saved)));
      } catch (error) {
        console.log('Postpartum plan load error:', error);
      }
    }

    void loadItems();
  }, []);

  const doneCount = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((counts, category) => {
      counts[category] = category === 'All'
        ? items.length
        : items.filter((item) => item.category === category).length;

      return counts;
    }, {});
  }, [items]);

  async function saveItems(next: PlanItem[]) {
    setItems(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Postpartum plan save error:', error);
    }
  }

  async function toggleItem(id: string) {
    await saveItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
            }
          : item
      )
    );
  }

  async function addCustomItem() {
    const clean = draft.trim();

    if (!clean) {
      Alert.alert('Add plan item', 'Type something to prepare first.');
      return;
    }

    setDraft('');

    await saveItems([
      ...items,
      {
        id: 'custom-' + Date.now(),
        title: clean,
        copy: 'Custom postpartum plan item.',
        category: 'Support',
        done: false,
        custom: true,
      },
    ]);
  }

  async function deleteCustomItem(id: string) {
    await saveItems(items.filter((item) => item.id !== id));
  }

  function resetPlan() {
    Alert.alert('Reset plan?', 'This will uncheck every postpartum item.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void saveItems(items.map((item) => ({ ...item, done: false })));
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>AFTER BIRTH</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Postpartum Plan</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Prepare your recovery, baby care, feeding support, and home help before delivery.
        </Text>
      </View>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.accentRail, { backgroundColor: palette.accent }]} />

        <View style={styles.progressTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>READY STATUS</Text>
            <Text style={[styles.progressTitle, { color: palette.ink }]}>
              {doneCount}/{items.length} ready
            </Text>
            <Text style={[styles.progressCopy, { color: palette.text }]}>
              A calmer first week starts with a clear plan.
            </Text>
          </View>

          <View style={[styles.percentBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.percentText, { color: palette.accent }]}>{progress}%</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: `${progress}%` as `${number}%`, backgroundColor: palette.accent }]} />
        </View>
      </View>

      <View style={styles.quickRow}>
        <QuickLink title="Safety" icon="shield-checkmark-outline" route="/safety-center" />
        <QuickLink title="Contacts" icon="call-outline" route="/emergency-contacts" />
        <QuickLink title="Bag" icon="bag-handle-outline" route="/hospital-bag-checklist" />
      </View>

      <View style={[styles.addCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.cardLabel, { color: palette.accent }]}>ADD YOUR OWN</Text>

        <View style={[styles.inputWrap, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Example: ask sister to help with laundry"
            placeholderTextColor={palette.muted}
            style={[styles.input, { color: palette.ink }]}
          />

          <AnimatedPressable onPress={addCustomItem} style={[styles.addButton, { backgroundColor: palette.accent }]}>
            <Ionicons name="add" size={18} color={palette.onAccent} />
          </AnimatedPressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((category) => {
          const active = activeCategory === category;

          return (
            <AnimatedPressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? palette.accent : palette.surface,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: active ? palette.onAccent : palette.ink }]}>
                {category}
              </Text>
              <Text style={[styles.categoryCount, { color: active ? palette.onAccent : palette.muted }]}>
                {categoryCounts[category]}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.listHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>PLAN</Text>
            <Text style={[styles.listTitle, { color: palette.ink }]}>
              {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
            </Text>
          </View>

          <AnimatedPressable onPress={resetPlan} style={[styles.resetButton, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.resetText, { color: palette.accent }]}>Reset</Text>
          </AnimatedPressable>
        </View>

        {filteredItems.map((item, index) => (
          <PlanRow
            key={item.id}
            item={item}
            last={index === filteredItems.length - 1}
            onToggle={() => toggleItem(item.id)}
            onDelete={() => deleteCustomItem(item.id)}
          />
        ))}
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name="heart-outline" size={19} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Postpartum recovery is real recovery. Ask for help early and contact your care team if something feels wrong.
        </Text>
      </View>
    </Screen>
  );
}

function QuickLink({
  title,
  icon,
  route,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(route as never)}
      style={[styles.quickLink, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.quickIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <Text style={[styles.quickText, { color: palette.ink }]}>{title}</Text>
    </AnimatedPressable>
  );
}

function PlanRow({
  item,
  last,
  onToggle,
  onDelete,
}: {
  item: PlanItem;
  last: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.planRow, { borderBottomColor: last ? 'transparent' : palette.line }]}>
      <AnimatedPressable
        onPress={onToggle}
        style={[
          styles.checkButton,
          {
            backgroundColor: item.done ? palette.accent : palette.canvas,
            borderColor: item.done ? palette.accent : palette.line,
          },
        ]}
      >
        <Ionicons
          name={item.done ? 'checkmark' : 'ellipse-outline'}
          size={18}
          color={item.done ? palette.onAccent : palette.accent}
        />
      </AnimatedPressable>

      <AnimatedPressable onPress={onToggle} style={styles.planBody}>
        <Text style={[styles.planTitle, { color: palette.ink }]}>{item.title}</Text>
        <Text style={[styles.planCopy, { color: palette.text }]} numberOfLines={2}>
          {item.copy}
        </Text>
      </AnimatedPressable>

      <View style={[styles.badge, { backgroundColor: palette.accentSoft }]}>
        <Text style={[styles.badgeText, { color: palette.accent }]}>{item.category}</Text>
      </View>

      {item.custom ? (
        <AnimatedPressable onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={palette.danger} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 10,
    marginBottom: 14,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.4,
  },
  title: {
    ...type.title,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    ...type.body,
    marginTop: 6,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  progressTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
    marginTop: 3,
  },
  progressCopy: {
    ...type.small,
    marginTop: 2,
  },
  percentBadge: {
    width: 66,
    height: 66,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },
  track: {
    height: 9,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 15,
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  quickLink: {
    flex: 1,
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickText: {
    ...type.small,
    fontWeight: '900',
  },
  addCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
  },
  inputWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 10,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 52,
    ...type.body,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 8,
    paddingRight: 8,
    marginBottom: 12,
  },
  categoryChip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryText: {
    ...type.small,
    fontWeight: '900',
  },
  categoryCount: {
    ...type.tiny,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 15,
    marginBottom: 12,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  listTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },
  resetButton: {
    minHeight: 36,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    ...type.small,
    fontWeight: '900',
  },
  planRow: {
    minHeight: 82,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
  },
  planTitle: {
    ...type.bodyStrong,
  },
  planCopy: {
    ...type.small,
    marginTop: 1,
  },
  badge: {
    minHeight: 28,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.tiny,
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    flex: 1,
  },
});
