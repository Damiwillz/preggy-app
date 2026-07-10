import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ShoppingItem = {
  id: string;
  title: string;
  category: string;
  priority: 'Low' | 'Normal' | 'High';
  bought: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:baby-shopping-list';

const categories = ['Clothing', 'Feeding', 'Bath', 'Nursery', 'Travel', 'Other'] as const;
const priorities = ['Low', 'Normal', 'High'] as const;

export default function BabyShoppingListScreen() {
  const { palette } = useAppTheme();

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Clothing');
  const [priority, setPriority] = useState<ShoppingItem['priority']>('Normal');

  const boughtCount = useMemo(() => items.filter((item) => item.bought).length, [items]);
  const progress = items.length ? Math.round((boughtCount / items.length) * 100) : 0;

  useEffect(() => {
    async function loadItems() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Baby shopping list load error:', error);
      }
    }

    void loadItems();
  }, []);

  async function saveItems(next: ShoppingItem[]) {
    setItems(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Baby shopping list save error:', error);
    }
  }

  async function addItem() {
    const clean = title.trim();

    if (!clean) {
      Alert.alert('Add an item', 'Type something you want to buy.');
      return;
    }

    const next: ShoppingItem[] = [
      {
        id: String(Date.now()),
        title: clean,
        category,
        priority,
        bought: false,
        createdAt: Date.now(),
      },
      ...items,
    ];

    setTitle('');
    setCategory('Clothing');
    setPriority('Normal');
    await saveItems(next);
  }

  async function toggleBought(id: string) {
    const next = items.map((item) =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );

    await saveItems(next);
  }

  async function deleteItem(id: string) {
    const next = items.filter((item) => item.id !== id);
    await saveItems(next);
  }

  async function clearBought() {
    const next = items.filter((item) => !item.bought);
    await saveItems(next);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>BABY PREP</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Shopping List</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Keep track of what you still need before baby arrives.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="cart-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>SHOPPING PROGRESS</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {boughtCount}/{items.length} bought
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              {items.length ? `${progress}% of your list is complete.` : 'Add your first baby item below.'}
            </Text>
          </View>

          <View style={[styles.progressBadge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.progressBadgeText, { color: palette.onAccent }]}>{progress}%</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW ITEM</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to buy?"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.chipLabel, { color: palette.text }]}>Category</Text>

          <View style={styles.chipRow}>
            {categories.map((item) => {
              const active = item === category;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.chipLabel, { color: palette.text }]}>Priority</Text>

          <View style={styles.chipRow}>
            {priorities.map((item) => {
              const active = item === priority;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setPriority(item)}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={addItem}
            style={[styles.addButton, { backgroundColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Add item</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.listHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: palette.accent }]}>SHOPPING LIST</Text>
              <Text style={[styles.listTitle, { color: palette.ink }]}>{items.length} items</Text>
            </View>

            <AnimatedPressable
              onPress={clearBought}
              style={[styles.clearButton, { backgroundColor: palette.accentSoft }]}
            >
              <Text style={[styles.clearText, { color: palette.accent }]}>Clear bought</Text>
            </AnimatedPressable>
          </View>

          {items.length ? (
            <View style={styles.itemList}>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.shoppingItem,
                    {
                      backgroundColor: item.bought ? palette.accentSoft : palette.canvas,
                      borderColor: item.bought ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <AnimatedPressable
                    onPress={() => toggleBought(item.id)}
                    style={[
                      styles.checkButton,
                      {
                        backgroundColor: item.bought ? palette.accent : palette.surface,
                        borderColor: item.bought ? palette.accent : palette.line,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.bought ? 'checkmark' : 'ellipse-outline'}
                      size={18}
                      color={item.bought ? palette.onAccent : palette.accent}
                    />
                  </AnimatedPressable>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: palette.ink,
                          textDecorationLine: item.bought ? 'line-through' : 'none',
                          opacity: item.bought ? 0.72 : 1,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={[styles.metaPill, { backgroundColor: palette.surface }]}>
                        <Text style={[styles.metaText, { color: palette.accent }]}>{item.category}</Text>
                      </View>

                      <View style={[styles.metaPill, { backgroundColor: palette.surface }]}>
                        <Text style={[styles.metaText, { color: palette.text }]}>{item.priority}</Text>
                      </View>
                    </View>
                  </View>

                  <AnimatedPressable onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={19} color={palette.danger} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No shopping items yet.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
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
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  progressBadge: {
    minWidth: 48,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  progressBadgeText: {
    ...type.tiny,
    fontWeight: '900',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  formCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    ...type.section,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 13,
    ...type.bodyStrong,
    fontSize: 15,
  },
  chipLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    minHeight: 38,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityChip: {
    minHeight: 38,
    minWidth: 74,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...type.tiny,
    fontWeight: '900',
  },
  addButton: {
    minHeight: 52,
    borderRadius: 20,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  listCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  listTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  clearButton: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...type.tiny,
    fontWeight: '900',
  },
  itemList: {
    gap: 10,
    marginTop: 14,
  },
  shoppingItem: {
    minHeight: 78,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  metaPill: {
    minHeight: 26,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  metaText: {
    ...type.tiny,
    fontWeight: '900',
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    marginTop: 14,
    fontWeight: '800',
  },
});
