import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ToolItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route: string;
};

type ToolSection = {
  title: string;
  copy: string;
  items: ToolItem[];
};

const FAVORITE_TOOLS_KEY = 'preggy:favorite-tools';

const toolSections: ToolSection[] = [
  {
    title: 'Tracking',
    copy: 'Daily body, baby, and labour trackers',
    items: [
      {
        icon: 'footsteps-outline',
        title: 'Kick Counter',
        copy: 'Track baby movement sessions',
        route: '/kick-counter',
      },
      {
        icon: 'analytics-outline',
        title: 'Movement History',
        copy: 'Review recent kick logs',
        route: '/movement-history',
      },
      {
        icon: 'pulse-outline',
        title: 'Contractions',
        copy: 'Time labour contractions',
        route: '/contraction-timer',
      },
      {
        icon: 'water-outline',
        title: 'Daily Care',
        copy: 'Checklist and water intake',
        route: '/daily-care',
      },
      {
        icon: 'scale-outline',
        title: 'Weight Tracker',
        copy: 'Log pregnancy weight',
        route: '/weight-tracker',
      },
      {
        icon: 'happy-outline',
        title: 'Mood Tracker',
        copy: 'Check mood and energy',
        route: '/mood-tracker',
      },
      {
        icon: 'calculator-outline',
        title: 'Due Date Calculator',
        copy: 'Estimate pregnancy dates',
        route: '/(tabs)/calculator?fromTools=1',
      },
    ],
  },
  {
    title: 'Planning',
    copy: 'Prepare for birth and appointments',
    items: [
      {
        icon: 'document-text-outline',
        title: 'Birth Plan',
        copy: 'Save care preferences',
        route: '/birth-plan',
      },
      {
        icon: 'bag-handle-outline',
        title: 'Hospital Bag',
        copy: 'Packing checklist',
        route: '/hospital-bag-checklist',
      },
      {
        icon: 'cart-outline',
        title: 'Shopping List',
        copy: 'Track baby items to buy',
        route: '/baby-shopping-list',
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Doctor Questions',
        copy: 'Prepare for visits',
        route: '/doctor-questions',
      },
      {
        icon: 'call-outline',
        title: 'Emergency Contacts',
        copy: 'Save important numbers',
        route: '/emergency-contacts',
      },
      {
        icon: 'business-outline',
        title: 'Hospital Info',
        copy: 'Save clinic and birth place',
        route: '/hospital-info',
      },
    ],
  },
  {
    title: 'Memories',
    copy: 'Capture your pregnancy journey',
    items: [
      {
        icon: 'book-outline',
        title: 'Journal',
        copy: 'Save memories and moods',
        route: '/pregnancy-journal',
      },
      {
        icon: 'heart-outline',
        title: 'Baby Names',
        copy: 'Save favorite name ideas',
        route: '/baby-names',
      },
      {
        icon: 'map-outline',
        title: 'Timeline',
        copy: 'View pregnancy journey',
        route: '/timeline?fromTools=1',
      },
    ],
  },
  {
    title: 'Learning & support',
    copy: 'Helpful guidance and AI support',
    items: [
      {
        icon: 'bulb-outline',
        title: 'Pregnancy Tips',
        copy: 'Guides and helpful articles',
        route: '/(tabs)/tips?fromTools=1',
      },
      {
        icon: 'sparkles-outline',
        title: 'Preggy AI',
        copy: 'Ask a pregnancy question',
        route: '/ai-chat?fromTools=1',
      },
    ],
  },
] as const;


export default function ToolsScreen() {
  const { palette } = useAppTheme();
  const [query, setQuery] = useState('');
  const [favoriteTools, setFavoriteTools] = useState<string[]>([]);

  const totalTools = toolSections.reduce((sum, section) => sum + section.items.length, 0);
  const allTools = toolSections.flatMap((section) => section.items);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const saved = await AsyncStorage.getItem(FAVORITE_TOOLS_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setFavoriteTools(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Favorite tools load error:', error);
      }
    }

    void loadFavorites();
  }, []);

  async function toggleFavorite(title: string) {
    const next = favoriteTools.includes(title)
      ? favoriteTools.filter((item) => item !== title)
      : [...favoriteTools, title];

    setFavoriteTools(next);

    try {
      await AsyncStorage.setItem(FAVORITE_TOOLS_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Favorite tools save error:', error);
    }
  }

  const favoriteItems = allTools.filter((item) => favoriteTools.includes(item.title));

  const filteredSections = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return toolSections;

    return toolSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${item.title} ${item.copy}`.toLowerCase().includes(cleanQuery)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY TOOLS</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Tools & Trackers</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Search, pin favorites, and open your pregnancy tools quickly.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>QUICK ACCESS</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>
              {totalTools} helpful tools
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="grid-outline" size={30} color={palette.onAccent} />
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
          Tap the heart on any card to pin it to Favorites.
        </Text>
      </View>

      <View style={[styles.searchCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Ionicons name="search" size={20} color={palette.accent} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tools..."
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { color: palette.ink }]}
        />

        {query.trim() ? (
          <AnimatedPressable onPress={() => setQuery('')} style={styles.clearSearch}>
            <Ionicons name="close-circle" size={20} color={palette.muted} />
          </AnimatedPressable>
        ) : null}
      </View>

      {!query.trim() && favoriteItems.length ? (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>Favorites</Text>
              <Text style={[styles.sectionCopy, { color: palette.text }]}>Your pinned tools</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {favoriteItems.map((item) => (
              <ToolCard
                key={`favorite-${item.title}`}
                item={item}
                favorite
                onToggleFavorite={() => toggleFavorite(item.title)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {filteredSections.length ? (
        filteredSections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>{section.title}</Text>
                <Text style={[styles.sectionCopy, { color: palette.text }]}>{section.copy}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              {section.items.map((item) => (
                <ToolCard
                  key={item.title}
                  item={item}
                  favorite={favoriteTools.includes(item.title)}
                  onToggleFavorite={() => toggleFavorite(item.title)}
                />
              ))}
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="search-outline" size={28} color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No tools found</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Try searching for movement, birth, hospital, journal, or questions.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function ToolCard({
  item,
  favorite,
  onToggleFavorite,
}: {
  item: ToolItem;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(item.route as never)}
      style={[styles.toolCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.toolIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={item.icon} size={24} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.toolTitle, { color: palette.ink }]}>{item.title}</Text>
        <Text style={[styles.toolCopy, { color: palette.text }]}>{item.copy}</Text>
      </View>

      <AnimatedPressable
        onPress={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        style={[
          styles.favoriteButton,
          {
            backgroundColor: favorite ? palette.accentSoft : palette.canvas,
            borderColor: favorite ? palette.accent : palette.line,
          },
        ]}
      >
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={19}
          color={favorite ? palette.accent : palette.muted}
        />
      </AnimatedPressable>
    </AnimatedPressable>
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
    minHeight: 170,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 18,
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
    fontSize: 31,
    lineHeight: 37,
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
  searchCard: {
    minHeight: 56,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    ...type.bodyStrong,
    fontSize: 15,
  },
  clearSearch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 26,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
    fontWeight: '800',
  },
  grid: {
    gap: 10,
  },
  toolCard: {
    minHeight: 88,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
  },
  toolCopy: {
    ...type.small,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '800',
  },
  emptyCard: {
    minHeight: 160,
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    marginTop: 12,
  },
  emptyCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '800',
  },
});
