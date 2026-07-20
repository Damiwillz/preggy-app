import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type RegistryCategory = 'Nursery' | 'Diapers' | 'Clothes' | 'Feeding' | 'Travel' | 'Other';
type RegistryStatus = 'Wanted' | 'Reserved' | 'Received';

type RegistryItem = {
  id: string;
  name: string;
  store: string;
  category: RegistryCategory;
  status: RegistryStatus;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:baby-registry-items';

const categories: RegistryCategory[] = ['Nursery', 'Diapers', 'Clothes', 'Feeding', 'Travel', 'Other'];
const statuses: RegistryStatus[] = ['Wanted', 'Reserved', 'Received'];

const starterItems: Array<{ name: string; category: RegistryCategory }> = [
  { name: 'Car seat', category: 'Travel' },
  { name: 'Diaper bag', category: 'Diapers' },
  { name: 'Baby monitor', category: 'Nursery' },
  { name: 'Burp cloths', category: 'Feeding' },
];

function parseItems(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RegistryItem[]) : [];
  } catch {
    return [];
  }
}

function createItem(name: string, store: string, category: RegistryCategory): RegistryItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    store,
    category,
    status: 'Wanted',
    createdAt: Date.now(),
  };
}

export default function BabyRegistryScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [items, setItems] = useState<RegistryItem[]>([]);
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [category, setCategory] = useState<RegistryCategory>('Nursery');

  useEffect(() => {
    async function loadItems() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setItems(parseItems(saved));
      } catch (error) {
        console.log('Baby registry load error:', error);
      }
    }

    void loadItems();
  }, []);

  const wantedCount = items.filter((item) => item.status === 'Wanted').length;
  const reservedCount = items.filter((item) => item.status === 'Reserved').length;
  const receivedCount = items.filter((item) => item.status === 'Received').length;

  async function saveItems(nextItems: RegistryItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch (error) {
      console.log('Baby registry save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function addItem() {
    const cleanName = name.trim();
    const cleanStore = store.trim() || 'Any store';

    if (!cleanName) {
      Alert.alert('Add an item', 'Type the registry item name first.');
      return;
    }

    const nextItems = [createItem(cleanName, cleanStore, category), ...items];

    setItems(nextItems);
    void saveItems(nextItems);
    setName('');
    setStore('');
  }

  function addStarterItem(item: { name: string; category: RegistryCategory }) {
    const nextItems = [createItem(item.name, 'Any store', item.category), ...items];

    setItems(nextItems);
    void saveItems(nextItems);
  }

  function updateStatus(itemId: string, status: RegistryStatus) {
    const nextItems = items.map((item) => (item.id === itemId ? { ...item, status } : item));

    setItems(nextItems);
    void saveItems(nextItems);
  }

  function removeItem(itemId: string) {
    Alert.alert('Remove item?', 'This will remove it from your registry.', [
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
      <Header title="Baby Registry" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="gift-outline" size={26} color={palette.accent} />
        </View>
        <Text style={styles.eyebrow}>PLANNING</Text>
        <Text style={styles.title}>Baby registry</Text>
        <Text style={styles.copy}>Track what you want, what someone reserved, and what you already received.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{wantedCount}</Text>
          <Text style={styles.summaryLabel}>wanted</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{reservedCount}</Text>
          <Text style={styles.summaryLabel}>reserved</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{receivedCount}</Text>
          <Text style={styles.summaryLabel}>received</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add registry item</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Item name"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={store}
          onChangeText={setStore}
          placeholder="Store or link note"
          placeholderTextColor={palette.muted}
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
          <Text style={styles.primaryButtonText}>Add item</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionLabel}>QUICK START</Text>

      <View style={styles.starterGrid}>
        {starterItems.map((item) => (
          <AnimatedPressable key={item.name} onPress={() => addStarterItem(item)} style={styles.starterCard}>
            <Text style={styles.starterName}>{item.name}</Text>
            <Text style={styles.starterCategory}>{item.category}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>YOUR REGISTRY</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="gift-outline" size={30} color={palette.accent} />
          <Text style={styles.emptyTitle}>No registry items yet</Text>
          <Text style={styles.emptyCopy}>Add your first item above or use a quick-start item.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <View style={styles.itemIcon}>
                <Ionicons name="gift-outline" size={19} color={palette.accent} />
              </View>

              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.category} • {item.store}
                </Text>
              </View>

              <AnimatedPressable onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={palette.muted} />
              </AnimatedPressable>
            </View>

            <View style={styles.statusRow}>
              {statuses.map((status) => {
                const active = item.status === status;

                return (
                  <AnimatedPressable
                    key={status}
                    onPress={() => updateStatus(item.id, status)}
                    style={[styles.statusChip, active && styles.activeStatusChip]}
                  >
                    <Text style={[styles.statusText, active && styles.activeStatusText]}>{status}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
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
      width: 52,
      height: 52,
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
      fontSize: 20,
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
    starterCategory: {
      ...type.tiny,
      color: palette.accent,
      marginTop: 6,
      textTransform: 'uppercase',
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
      borderRadius: 24,
      padding: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 10,
    },
    itemTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    itemIcon: {
      width: 40,
      height: 40,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      ...type.bodyStrong,
      color: palette.ink,
    },
    itemMeta: {
      ...type.tiny,
      color: palette.text,
      marginTop: 3,
      textTransform: 'uppercase',
    },
    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.canvas,
    },
    statusRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    statusChip: {
      flex: 1,
      borderRadius: 999,
      paddingVertical: 9,
      alignItems: 'center',
      backgroundColor: palette.canvas,
      borderWidth: 1,
      borderColor: palette.line,
    },
    activeStatusChip: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    statusText: {
      ...type.tiny,
      color: palette.text,
      textTransform: 'uppercase',
    },
    activeStatusText: {
      color: palette.onAccent,
    },
  });
}
