import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ToolCategory = 'Tracking' | 'Planning' | 'Wellness' | 'Memories' | 'Support';

type ToolItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route: string;
  category: ToolCategory;
  featured?: boolean;
};

const FAVORITE_TOOLS_KEY = 'preggy:favorite-tools';

const categories: Array<ToolCategory | 'All'> = ['All', 'Tracking', 'Planning', 'Wellness', 'Memories', 'Support'];

const tools: ToolItem[] = [
  {
    icon: 'water-outline',
    title: 'Daily Care',
    copy: 'Checklist and water intake',
    route: '/daily-care',
    category: 'Tracking',
    featured: true,
  },
  {
    icon: 'footsteps-outline',
    title: 'Kick Counter',
    copy: 'Track baby movements',
    route: '/kick-counter',
    category: 'Tracking',
    featured: true,
  },
  {
    icon: 'analytics-outline',
    title: 'Movement History',
    copy: 'Review recent kick logs',
    route: '/movement-history',
    category: 'Tracking',
  },
  {
    icon: 'timer-outline',
    title: 'Contractions',
    copy: 'Time labour waves',
    route: '/contraction-timer',
    category: 'Tracking',
    featured: true,
  },
  {
    icon: 'pulse-outline',
    title: 'Contraction History',
    copy: 'Review saved sessions',
    route: '/contraction-history',
    category: 'Tracking',
  },
  {
    icon: 'scale-outline',
    title: 'Weight Tracker',
    copy: 'Log pregnancy weight',
    route: '/weight-tracker',
    category: 'Tracking',
  },
  {
    icon: 'calendar-outline',
    title: 'Due Date Calculator',
    copy: 'Estimate your due date',
    route: '/(tabs)/calculator?fromTools=1',
    category: 'Tracking',
  },
  {
    icon: 'happy-outline',
    title: 'Mood Tracker',
    copy: 'Check mood and energy',
    route: '/mood-tracker',
    category: 'Wellness',
    featured: true,
  },
  {
    icon: 'restaurant-outline',
    title: 'Cravings Tracker',
    copy: 'Save cravings and intensity',
    route: '/cravings-tracker',
    category: 'Wellness',
  },
  {
    icon: 'document-text-outline',
    title: 'Birth Plan',
    copy: 'Prepare delivery wishes',
    route: '/birth-plan',
    category: 'Planning',
    featured: true,
  },
  {
    icon: 'bag-handle-outline',
    title: 'Hospital Bag',
    copy: 'Packing checklist',
    route: '/hospital-bag-checklist',
    category: 'Planning',
  },
  {
    icon: 'cart-outline',
    title: 'Shopping List',
    copy: 'Track baby items to buy',
    route: '/baby-shopping-list',
    category: 'Planning',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Doctor Questions',
    copy: 'Prepare for visits',
    route: '/doctor-questions',
    category: 'Planning',
  },
  {
    icon: 'call-outline',
    title: 'Emergency Contacts',
    copy: 'Save important numbers',
    route: '/emergency-contacts',
    category: 'Planning',
  },
  {
    icon: 'business-outline',
    title: 'Hospital Info',
    copy: 'Save clinic and birth place',
    route: '/hospital-info',
    category: 'Planning',
  },
  {
    icon: 'heart-outline',
    title: 'Baby Names',
    copy: 'Save favorite name ideas',
    route: '/baby-names',
    category: 'Memories',
    featured: true,
  },
  {
    icon: 'book-outline',
    title: 'Journal',
    copy: 'Save memories and moods',
    route: '/pregnancy-journal',
    category: 'Memories',
  },
  {
    icon: 'albums-outline',
    title: 'Timeline',
    copy: 'Capture pregnancy moments',
    route: '/timeline',
    category: 'Memories',
  },
  {
    icon: 'school-outline',
    title: 'Pregnancy Tips',
    copy: 'Learn week by week',
    route: '/(tabs)/tips?fromTools=1',
    category: 'Support',
  },
  {
    icon: 'sparkles-outline',
    title: 'Preggy AI',
    copy: 'Ask a pregnancy question',
    route: '/ai-chat?fromTools=1',
    category: 'Support',
    featured: true,
  },
];

export default function ToolsScreen() {
  const { palette } = useAppTheme();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All');
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>([]);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const saved = await AsyncStorage.getItem(FAVORITE_TOOLS_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setFavoriteRoutes(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Favorite tools load error:', error);
      }
    }

    void loadFavorites();
  }, []);

  async function saveFavorites(next: string[]) {
    setFavoriteRoutes(next);

    try {
      await AsyncStorage.setItem(FAVORITE_TOOLS_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Favorite tools save error:', error);
    }
  }

  function toggleFavorite(route: string) {
    const next = favoriteRoutes.includes(route)
      ? favoriteRoutes.filter((item) => item !== route)
      : [...favoriteRoutes, route];

    void saveFavorites(next);
  }

  const favoriteTools = useMemo(
    () => tools.filter((item) => favoriteRoutes.includes(item.route)),
    [favoriteRoutes]
  );

  const featuredTools = useMemo(() => {
    const favorites = favoriteTools.slice(0, 4);

    if (favorites.length) return favorites;

    return tools.filter((item) => item.featured).slice(0, 4);
  }, [favoriteTools]);

  const filteredTools = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return tools.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch =
        !cleanQuery ||
        item.title.toLowerCase().includes(cleanQuery) ||
        item.copy.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  const groupedTools = useMemo(() => {
    return categories
      .filter((item): item is ToolCategory => item !== 'All')
      .map((category) => ({
        category,
        items: filteredTools.filter((item) => item.category === category),
      }))
      .filter((section) => section.items.length > 0);
  }, [filteredTools]);

  return (
    <Screen bottomSpace={120}>
      <Header title="" />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY TOOLS</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Your toolkit</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Clean, simple tools for tracking, planning, memories, and support.
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Ionicons name="search" size={19} color={palette.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tools"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          style={[styles.searchInput, { color: palette.ink }]}
        />
        {query ? (
          <AnimatedPressable onPress={() => setQuery('')} style={styles.clearSearch}>
            <Ionicons name="close-circle" size={19} color={palette.muted} />
          </AnimatedPressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
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
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {!query && activeCategory === 'All' ? (
        <View style={[styles.featuredCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>
                {favoriteTools.length ? 'FAVORITES' : 'QUICK START'}
              </Text>
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                {favoriteTools.length ? 'Your saved tools' : 'Most useful tools'}
              </Text>
            </View>
          </View>

          <View style={styles.featuredGrid}>
            {featuredTools.map((item) => (
              <FeaturedToolCard
                key={item.route}
                item={item}
                favorite={favoriteRoutes.includes(item.route)}
                onFavorite={() => toggleFavorite(item.route)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.resultHeader}>
        <Text style={[styles.resultTitle, { color: palette.ink }]}>
          {activeCategory === 'All' ? 'All tools' : activeCategory}
        </Text>
        <Text style={[styles.resultCount, { color: palette.text }]}>
          {filteredTools.length} tools
        </Text>
      </View>

      {groupedTools.length ? (
        groupedTools.map((section) => (
          <View
            key={section.category}
            style={[styles.groupCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Text style={[styles.groupTitle, { color: palette.accent }]}>{section.category}</Text>

            <View style={styles.compactList}>
              {section.items.map((item) => (
                <CompactToolRow
                  key={item.route}
                  item={item}
                  favorite={favoriteRoutes.includes(item.route)}
                  onFavorite={() => toggleFavorite(item.route)}
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
            Try another search or category.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function FeaturedToolCard({
  item,
  favorite,
  onFavorite,
}: {
  item: ToolItem;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(item.route as never)}
      style={[styles.featuredTool, { backgroundColor: palette.canvas, borderColor: palette.line }]}
    >
      <View style={styles.featuredTop}>
        <View style={[styles.featuredIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={item.icon} size={21} color={palette.accent} />
        </View>

        <AnimatedPressable onPress={onFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={favorite ? palette.accent : palette.muted}
          />
        </AnimatedPressable>
      </View>

      <Text style={[styles.featuredTitle, { color: palette.ink }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.featuredCopy, { color: palette.text }]} numberOfLines={2}>
        {item.copy}
      </Text>
    </AnimatedPressable>
  );
}

function CompactToolRow({
  item,
  favorite,
  onFavorite,
}: {
  item: ToolItem;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(item.route as never)}
      style={[styles.toolRow, { backgroundColor: palette.canvas, borderColor: palette.line }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={item.icon} size={20} color={palette.accent} />
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.rowCopy, { color: palette.text }]} numberOfLines={1}>
          {item.copy}
        </Text>
      </View>

      <AnimatedPressable onPress={onFavorite} style={styles.rowAction}>
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={19}
          color={favorite ? palette.accent : palette.muted}
        />
      </AnimatedPressable>

      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 16,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.9,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  searchBox: {
    minHeight: 54,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    ...type.bodyStrong,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearSearch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    minHeight: 39,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    ...type.tiny,
    fontWeight: '900',
  },
  featuredCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 13,
  },
  sectionEyebrow: {
    ...type.section,
    letterSpacing: 1.1,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featuredTool: {
    width: '48%',
    minHeight: 132,
    borderRadius: 24,
    borderWidth: 1,
    padding: 13,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 14,
  },
  featuredCopy: {
    ...type.tiny,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  resultTitle: {
    ...type.bodyStrong,
    fontSize: 22,
  },
  resultCount: {
    ...type.tiny,
    fontWeight: '900',
  },
  groupCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  groupTitle: {
    ...type.section,
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  compactList: {
    gap: 8,
  },
  toolRow: {
    minHeight: 70,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...type.bodyStrong,
    fontSize: 15.5,
    lineHeight: 20,
  },
  rowCopy: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '800',
  },
  rowAction: {
    width: 34,
    height: 34,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 10,
  },
  emptyCopy: {
    ...type.small,
    fontWeight: '800',
    marginTop: 4,
  },
});
