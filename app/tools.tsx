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

const categoryMeta: Record<
  ToolCategory,
  {
    icon: keyof typeof Ionicons.glyphMap;
    copy: string;
  }
> = {
  Tracking: {
    icon: 'analytics-outline',
    copy: 'Daily logs, body changes, movement, and timing.',
  },
  Planning: {
    icon: 'clipboard-outline',
    copy: 'Birth prep, hospital details, lists, and contacts.',
  },
  Wellness: {
    icon: 'leaf-outline',
    copy: 'Mood, cravings, rest, and gentle check-ins.',
  },
  Memories: {
    icon: 'heart-outline',
    copy: 'Names, journal notes, and pregnancy moments.',
  },
  Support: {
    icon: 'sparkles-outline',
    copy: 'Tips and Preggy AI support.',
  },
};

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
    icon: 'moon-outline',
    title: 'Sleep Tracker',
    copy: 'Log sleep and night symptoms',
    route: '/sleep-tracker',
    category: 'Wellness',
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

  const quickTools = useMemo(() => {
    if (favoriteTools.length) return favoriteTools.slice(0, 6);
    return tools.filter((item) => item.featured).slice(0, 6);
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

  const visibleCategories = useMemo(() => {
    const grouped = categories
      .filter((item): item is ToolCategory => item !== 'All')
      .map((category) => ({
        category,
        items: filteredTools.filter((item) => item.category === category),
      }))
      .filter((section) => section.items.length > 0);

    return grouped;
  }, [filteredTools]);

  const totalFavorites = favoriteRoutes.length;

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY TOOLKIT</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>Tools</Text>
          </View>

          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="grid-outline" size={26} color={palette.accent} />
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.text }]}>
          Everything you need for tracking, planning, wellness, and memories — organized softly.
        </Text>

        <View style={styles.heroStats}>
          <View style={[styles.statPill, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.statValue, { color: palette.ink }]}>{tools.length}</Text>
            <Text style={[styles.statLabel, { color: palette.text }]}>Tools</Text>
          </View>

          <View style={[styles.statPill, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.statValue, { color: palette.ink }]}>{totalFavorites}</Text>
            <Text style={[styles.statLabel, { color: palette.text }]}>Favorites</Text>
          </View>
        </View>
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
        <View style={styles.quickSection}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>
                {favoriteTools.length ? 'FAVORITES' : 'QUICK ACCESS'}
              </Text>
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                {favoriteTools.length ? 'Saved tools' : 'Start here'}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {quickTools.map((item) => (
              <QuickToolCard
                key={item.route}
                item={item}
                favorite={favoriteRoutes.includes(item.route)}
                onFavorite={() => toggleFavorite(item.route)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {query || activeCategory !== 'All' ? (
        <View style={styles.resultHeader}>
          <Text style={[styles.resultTitle, { color: palette.ink }]}>
            {filteredTools.length} result{filteredTools.length === 1 ? '' : 's'}
          </Text>
          <Text style={[styles.resultCopy, { color: palette.text }]}>
            {activeCategory === 'All' ? 'All categories' : activeCategory}
          </Text>
        </View>
      ) : (
        <View style={styles.resultHeader}>
          <Text style={[styles.resultTitle, { color: palette.ink }]}>Browse by category</Text>
          <Text style={[styles.resultCopy, { color: palette.text }]}>Clean grouped tools</Text>
        </View>
      )}

      {visibleCategories.length ? (
        visibleCategories.map((section) => (
          <CategoryCard
            key={section.category}
            category={section.category}
            items={section.items}
            favoriteRoutes={favoriteRoutes}
            onFavorite={toggleFavorite}
          />
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="search-outline" size={30} color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No tools found</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Try another search or choose a different category.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function QuickToolCard({
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
      style={[styles.quickCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={styles.quickTop}>
        <View style={[styles.quickIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={item.icon} size={22} color={palette.accent} />
        </View>

        <AnimatedPressable onPress={onFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={favorite ? palette.accent : palette.muted}
          />
        </AnimatedPressable>
      </View>

      <Text style={[styles.quickTitle, { color: palette.ink }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.quickCopy, { color: palette.text }]} numberOfLines={2}>
        {item.copy}
      </Text>
    </AnimatedPressable>
  );
}

function CategoryCard({
  category,
  items,
  favoriteRoutes,
  onFavorite,
}: {
  category: ToolCategory;
  items: ToolItem[];
  favoriteRoutes: string[];
  onFavorite: (route: string) => void;
}) {
  const { palette } = useAppTheme();
  const meta = categoryMeta[category];

  return (
    <View style={[styles.categoryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={meta.icon} size={22} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.categoryTitle, { color: palette.ink }]}>{category}</Text>
          <Text style={[styles.categoryCopy, { color: palette.text }]}>{meta.copy}</Text>
        </View>

        <View style={[styles.countBadge, { backgroundColor: palette.accentSoft }]}>
          <Text style={[styles.countBadgeText, { color: palette.accent }]}>{items.length}</Text>
        </View>
      </View>

      <View style={styles.toolList}>
        {items.map((item) => (
          <ToolRow
            key={item.route}
            item={item}
            favorite={favoriteRoutes.includes(item.route)}
            onFavorite={() => onFavorite(item.route)}
          />
        ))}
      </View>
    </View>
  );
}

function ToolRow({
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
        <Ionicons name={item.icon} size={19} color={palette.accent} />
      </View>

      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.rowCopy, { color: palette.text }]} numberOfLines={1}>
          {item.copy}
        </Text>
      </View>

      <AnimatedPressable onPress={onFavorite} style={styles.rowFavorite}>
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
  hero: {
    borderRadius: 34,
    borderWidth: 1,
    padding: 20,
    marginTop: 14,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  heroTitle: {
    ...type.title,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.2,
    marginTop: 5,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    ...type.small,
    lineHeight: 21,
    marginTop: 10,
    fontWeight: '800',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statPill: {
    flex: 1,
    minHeight: 62,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  statValue: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 25,
  },
  statLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 2,
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
    paddingBottom: 18,
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
  quickSection: {
    marginBottom: 18,
  },
  sectionHeading: {
    marginBottom: 11,
  },
  sectionEyebrow: {
    ...type.section,
    letterSpacing: 1.1,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    marginTop: 5,
  },
  quickRow: {
    gap: 10,
    paddingRight: 4,
  },
  quickCard: {
    width: 152,
    minHeight: 142,
    borderRadius: 26,
    borderWidth: 1,
    padding: 14,
  },
  quickTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
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
  quickTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
    marginTop: 16,
  },
  quickCopy: {
    ...type.tiny,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  resultHeader: {
    marginBottom: 11,
  },
  resultTitle: {
    ...type.bodyStrong,
    fontSize: 23,
    lineHeight: 28,
  },
  resultCopy: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 3,
  },
  categoryCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 15,
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 13,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 24,
  },
  categoryCopy: {
    ...type.tiny,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  countBadge: {
    minWidth: 36,
    height: 34,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    ...type.tiny,
    fontWeight: '900',
  },
  toolList: {
    gap: 8,
  },
  toolRow: {
    minHeight: 68,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
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
  rowFavorite: {
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
    textAlign: 'center',
  },
});
