import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BudgetCategory = 'Nursery' | 'Diapers' | 'Clothes' | 'Feeding' | 'Health' | 'Other';

type BudgetItem = {
  id: string;
  name: string;
  amount: number;
  category: BudgetCategory;
  bought: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:baby-budget-items';

const categories: BudgetCategory[] = ['Nursery', 'Diapers', 'Clothes', 'Feeding', 'Health', 'Other'];

const starterItems: Array<{ name: string; amount: number; category: BudgetCategory }> = [
  { name: 'Diapers', amount: 45, category: 'Diapers' },
  { name: 'Baby wipes', amount: 25, category: 'Diapers' },
  { name: 'Onesies', amount: 60, category: 'Clothes' },
  { name: 'Bottles', amount: 35, category: 'Feeding' },
];

function parseItems(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BudgetItem[]) : [];
  } catch {
    return [];
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function createBudgetItem(name: string, amount: number, category: BudgetCategory): BudgetItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    amount,
    category,
    bought: false,
    createdAt: Date.now(),
  };
}

export default function BabyBudgetScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [items, setItems] = useState<BudgetItem[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('Nursery');

  useEffect(() => {
    async function loadItems() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setItems(parseItems(saved));
      } catch (error) {
        console.log('Baby budget load error:', error);
      }
    }

    void loadItems();
  }, []);

  const totals = useMemo(() => {
    const planned = items.reduce((sum, item) => sum + item.amount, 0);
    const bought = items.filter((item) => item.bought).reduce((sum, item) => sum + item.amount, 0);

    return {
      planned,
      bought,
      remaining: planned - bought,
      boughtCount: items.filter((item) => item.bought).length,
    };
  }, [items]);

  const categoryTotals = useMemo(
    () =>
      categories.map((currentCategory) => {
        const total = items
          .filter((item) => item.category === currentCategory)
          .reduce((sum, item) => sum + item.amount, 0);

        return {
          category: currentCategory,
          total,
        };
      }),
    [items]
  );

  async function saveItems(nextItems: BudgetItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch (error) {
      console.log('Baby budget save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function addItem() {
    const cleanName = name.trim();
    const cleanAmount = Number(amount.replace(/[^0-9.]/g, ''));

    if (!cleanName || !Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      Alert.alert('Add item details', 'Enter an item name and a price first.');
      return;
    }

    const nextItems = [createBudgetItem(cleanName, cleanAmount, category), ...items];

    setItems(nextItems);
    void saveItems(nextItems);
    setName('');
    setAmount('');
  }

  function addStarterItem(item: { name: string; amount: number; category: BudgetCategory }) {
    const nextItems = [createBudgetItem(item.name, item.amount, item.category), ...items];

    setItems(nextItems);
    void saveItems(nextItems);
  }

  function toggleItem(itemId: string) {
    const nextItems = items.map((item) => (item.id === itemId ? { ...item, bought: !item.bought } : item));

    setItems(nextItems);
    void saveItems(nextItems);
  }

  function removeItem(itemId: string) {
    Alert.alert('Remove item?', 'This will remove it from your budget.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const nextItems = items.filter((item) => item.id !== itemId);
          setItems(nextItems);
          void saveItems(nextItems);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title="Baby Budget" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="cart-outline" size={24} color={palette.accent} />
        </View>
        <Text style={styles.eyebrow}>PLANNING</Text>
        <Text style={styles.title}>Baby budget</Text>
        <Text style={styles.copy}>Plan what you need, what it costs, and what is already bought.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatMoney(totals.planned)}</Text>
          <Text style={styles.summaryLabel}>planned</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatMoney(totals.remaining)}</Text>
          <Text style={styles.summaryLabel}>left</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totals.boughtCount}/{items.length}</Text>
          <Text style={styles.summaryLabel}>bought</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add item</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Item name"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Price"
          placeholderTextColor={palette.muted}
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <View style={styles.chips}>
          {categories.map((currentCategory) => {
            const active = currentCategory === category;

            return (
              <AnimatedPressable
                key={currentCategory}
                onPress={() => setCategory(currentCategory)}
                style={[styles.chip, active && styles.activeChip]}
              >
                <Text style={[styles.chipText, active && styles.activeChipText]}>{currentCategory}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <AnimatedPressable onPress={addItem} style={styles.primaryButton}>
          <Ionicons name="add-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>Add to budget</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionLabel}>QUICK START</Text>
      <View style={styles.starterGrid}>
        {starterItems.map((item) => (
          <AnimatedPressable key={item.name} onPress={() => addStarterItem(item)} style={styles.starterCard}>
            <Text style={styles.starterName}>{item.name}</Text>
            <Text style={styles.starterPrice}>{formatMoney(item.amount)}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>By category</Text>

        {categoryTotals.map((item) => (
          <View key={item.category} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{item.category}</Text>
            <Text style={styles.categoryAmount}>{formatMoney(item.total)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>YOUR LIST</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="clipboard-outline" size={28} color={palette.accent} />
          <Text style={styles.emptyTitle}>No budget items yet</Text>
          <Text style={styles.emptyCopy}>Add your first item above or use a quick-start item.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <AnimatedPressable onPress={() => toggleItem(item.id)} style={styles.checkCircle}>
              <Ionicons
                name={item.bought ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={item.bought ? palette.accent : palette.muted}
              />
            </AnimatedPressable>

            <View style={styles.itemContent}>
              <Text style={[styles.itemName, item.bought && styles.boughtText]}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.category}</Text>
            </View>

            <Text style={styles.itemAmount}>{formatMoney(item.amount)}</Text>

            <AnimatedPressable onPress={() => removeItem(item.id)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={18} color={palette.muted} />
            </AnimatedPressable>
          </View>
        ))
      )}
    </Screen>
  );
}

type AppPalette = ReturnType<typeof useAppTheme>['palette'];

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    hero: {
      borderRadius: 30,
      padding: 22,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginTop: 12,
      marginBottom: 14,
    },
    heroIcon: {
      width: 50,
      height: 50,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
      marginBottom: 16,
    },
    eyebrow: {
      ...type.section,
      color: palette.accent,
      marginBottom: 4,
    },
    title: {
      ...type.title,
      color: palette.ink,
    },
    copy: {
      ...type.body,
      color: palette.text,
      marginTop: 8,
    },
    summaryGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.accentSoft,
      borderWidth: 1,
      borderColor: palette.line,
    },
    summaryValue: {
      ...type.bodyStrong,
      color: palette.ink,
      fontSize: 18,
    },
    summaryLabel: {
      ...type.tiny,
      color: palette.text,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    card: {
      borderRadius: 28,
      padding: 18,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 16,
    },
    cardTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginBottom: 12,
      fontSize: 18,
    },
    input: {
      ...type.body,
      color: palette.ink,
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.line,
      backgroundColor: palette.canvas,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: palette.canvas,
      borderWidth: 1,
      borderColor: palette.line,
    },
    activeChip: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    chipText: {
      ...type.small,
      color: palette.text,
    },
    activeChipText: {
      color: palette.onAccent,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 20,
      backgroundColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButtonText: {
      ...type.bodyStrong,
      color: palette.onAccent,
    },
    sectionLabel: {
      ...type.section,
      color: palette.accent,
      marginBottom: 10,
      marginTop: 4,
    },
    starterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    starterCard: {
      width: '48%',
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    starterName: {
      ...type.small,
      color: palette.ink,
    },
    starterPrice: {
      ...type.bodyStrong,
      color: palette.accent,
      marginTop: 6,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: palette.line,
    },
    categoryName: {
      ...type.small,
      color: palette.text,
    },
    categoryAmount: {
      ...type.bodyStrong,
      color: palette.ink,
    },
    emptyCard: {
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    emptyTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginTop: 12,
    },
    emptyCopy: {
      ...type.small,
      color: palette.text,
      textAlign: 'center',
      marginTop: 4,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 10,
    },
    checkCircle: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      ...type.bodyStrong,
      color: palette.ink,
    },
    boughtText: {
      textDecorationLine: 'line-through',
      color: palette.muted,
    },
    itemMeta: {
      ...type.tiny,
      color: palette.text,
      marginTop: 2,
      textTransform: 'uppercase',
    },
    itemAmount: {
      ...type.bodyStrong,
      color: palette.ink,
    },
    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.canvas,
    },
  });
}
