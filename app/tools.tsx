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
const LAST_CATEGORY_KEY = 'preggy:last-tools-category';

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

const categories: ToolCategory[] = ['Tracking', 'Planning', 'Wellness', 'Memories', 'Support'];

const tools: ToolItem[] = [
  {
    icon: 'home-outline',
    title: 'Postpartum Plan',
    copy: 'Prepare recovery and home support',
    route: '/postpartum-plan',
    category: 'Planning',
  },
  {
    icon: 'briefcase-outline',
    title: 'Maternity Leave',
    copy: 'Plan dates, HR notes and tasks',
    route: '/maternity-leave-plan',
    category: 'Planning',
  },
  {
    icon: 'people-outline',
    title: 'Partner Support',
    copy: 'Plan help from your people',
    route: '/partner-support',
    category: 'Support',
  },
  {
    icon: 'heart-circle-outline',
    title: 'Blood Pressure',
    copy: 'Log pressure, pulse and notes',
    route: '/blood-pressure-tracker',
    category: 'Tracking',
  },
  {
    icon: 'folder-outline',
    title: 'Documents Checklist',
    copy: 'Keep important papers ready',
    route: '/documents-checklist',
    category: 'Planning',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safety Center',
    copy: 'Warning signs and quick safety links',
    route: '/safety-center',
    category: 'Support',
  },
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
    icon: 'cart-outline',
    title: 'Baby Budget',
    copy: 'Plan baby costs and purchases',
    route: '/baby-budget',
    category: 'Planning',
  },
  {
    icon: 'gift-outline',
    title: 'Baby Registry',
    copy: 'Track wanted and received gifts',
    route: '/baby-registry',
    category: 'Planning',
  },
  {
    icon: 'folder-open-outline',
    title: 'Doctor Visit Pack',
    copy: 'Review questions, symptoms and meds',
    route: '/doctor-visit-pack',
    category: 'Planning',
    featured: true,
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
  {
    icon: 'newspaper-outline',
    title: 'Weekly Report',
    copy: 'Review your 7-day summary',
    route: '/weekly-report',
    category: 'Support',
  },
  {
    icon: 'notifications-outline',
    title: 'Reminder Settings',
    copy: 'Manage reminder preferences',
    route: '/reminder-settings',
    category: 'Support',
  },
];


export default function ToolsScreen() {
  const { palette } = useAppTheme();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('Tracking');
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>([]);

  useEffect(() => {
    async function loadSavedToolsState() {
      try {
        const [savedFavorites, savedCategory] = await Promise.all([
          AsyncStorage.getItem(FAVORITE_TOOLS_KEY),
          AsyncStorage.getItem(LAST_CATEGORY_KEY),
        ]);

        const parsedFavorites = savedFavorites ? JSON.parse(savedFavorites) : [];
        setFavoriteRoutes(Array.isArray(parsedFavorites) ? parsedFavorites : []);

        if (savedCategory && categories.includes(savedCategory as ToolCategory)) {
          setActiveCategory(savedCategory as ToolCategory);
        }
      } catch (error) {
        console.log('Tools state load error:', error);
      }
    }

    void loadSavedToolsState();
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

  function selectCategory(category: ToolCategory) {
    setActiveCategory(category);

    AsyncStorage.setItem(LAST_CATEGORY_KEY, category).catch((error) => {
      console.log('Last tools category save error:', error);
    });
  }

  function openTool(item: ToolItem) {
    selectCategory(item.category);
    router.push(item.route as never);
  }

  const favoriteTools = useMemo(
    () => tools.filter((item) => favoriteRoutes.includes(item.route)),
    [favoriteRoutes]
  );

  const quickTools = useMemo(() => {
    if (favoriteTools.length) return favoriteTools.slice(0, 6);
    return tools.filter((item) => item.featured).slice(0, 6);
  }, [favoriteTools]);

  const activeTools = useMemo(
    () => tools.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const searchedTools = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return [];

    return tools.filter((item) => {
      return (
        item.title.toLowerCase().includes(cleanQuery) ||
        item.copy.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery)
      );
    });
  }, [query]);

  const cleanQuery = query.trim();
  const visibleTools = cleanQuery ? searchedTools : activeTools;
  const totalFavorites = favoriteRoutes.length;
  const activeMeta = categoryMeta[activeCategory];

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
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY TOOLKIT</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>Tools</Text>
          </View>

          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="grid-outline" size={25} color={palette.accent} />
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.text }]}>
          Quick tools first. Then open one section at a time so the page stays clean.
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

          <View style={[styles.statPill, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.statValueSmall, { color: palette.ink }]} numberOfLines={1}>
              {activeCategory}
            </Text>
            <Text style={[styles.statLabel, { color: palette.text }]}>Last opened</Text>
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
              onOpen={() => openTool(item)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>SECTIONS</Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>Choose one</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <CategorySelectCard
            key={category}
            category={category}
            active={category === activeCategory && !cleanQuery}
            count={tools.filter((item) => item.category === category).length}
            onPress={() => {
              setQuery('');
              selectCategory(category);
            }}
          />
        ))}
      </View>

      {visibleTools.length ? (
        <ToolsPanel
          title={cleanQuery ? 'Search results' : activeCategory}
          copy={cleanQuery ? 'Matching tools from every section.' : activeMeta.copy}
          icon={cleanQuery ? 'search-outline' : activeMeta.icon}
          items={visibleTools}
          favoriteRoutes={favoriteRoutes}
          onFavorite={toggleFavorite}
          onOpen={openTool}
        />
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="search-outline" size={30} color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No tools found</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Try another search or choose a different section.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function CategorySelectCard({
  category,
  active,
  count,
  onPress,
}: {
  category: ToolCategory;
  active: boolean;
  count: number;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();
  const meta = categoryMeta[category];

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.categorySelectCard,
        {
          backgroundColor: active ? palette.accent : palette.surface,
          borderColor: active ? palette.accent : palette.line,
        },
      ]}
    >
      <View style={styles.categorySelectTop}>
        <View
          style={[
            styles.categorySelectIcon,
            {
              backgroundColor: active ? palette.onAccent : palette.accentSoft,
            },
          ]}
        >
          <Ionicons name={meta.icon} size={20} color={active ? palette.accent : palette.accent} />
        </View>

        <View
          style={[
            styles.categorySelectCount,
            {
              backgroundColor: active ? palette.onAccent : palette.accentSoft,
            },
          ]}
        >
          <Text style={[styles.categorySelectCountText, { color: palette.accent }]}>{count}</Text>
        </View>
      </View>

      <Text style={[styles.categorySelectTitle, { color: active ? palette.onAccent : palette.ink }]}>
        {category}
      </Text>
      <Text style={[styles.categorySelectCopy, { color: active ? palette.onAccent : palette.text }]} numberOfLines={2}>
        {meta.copy}
      </Text>
    </AnimatedPressable>
  );
}

function QuickToolCard({
  item,
  favorite,
  onFavorite,
  onOpen,
}: {
  item: ToolItem;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onOpen}
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

function ToolsPanel({
  title,
  copy,
  icon,
  items,
  favoriteRoutes,
  onFavorite,
  onOpen,
}: {
  title: string;
  copy: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: ToolItem[];
  favoriteRoutes: string[];
  onFavorite: (route: string) => void;
  onOpen: (item: ToolItem) => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.categoryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={icon} size={22} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.categoryTitle, { color: palette.ink }]}>{title}</Text>
          <Text style={[styles.categoryCopy, { color: palette.text }]}>{copy}</Text>
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
            onOpen={() => onOpen(item)}
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
  onOpen,
}: {
  item: ToolItem;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onOpen}
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
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
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
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.1,
    marginTop: 5,
  },
  heroIcon: {
    width: 52,
    height: 52,
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
    gap: 8,
    marginTop: 15,
  },
  statPill: {
    flex: 1,
    minHeight: 60,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  statValue: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 24,
  },
  statValueSmall: {
    ...type.bodyStrong,
    fontSize: 14,
    lineHeight: 19,
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
    marginBottom: 16,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categorySelectCard: {
    width: '48%',
    minHeight: 138,
    borderRadius: 25,
    borderWidth: 1,
    padding: 13,
  },
  categorySelectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categorySelectIcon: {
    width: 40,
    height: 40,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelectCount: {
    minWidth: 32,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  categorySelectCountText: {
    ...type.tiny,
    fontWeight: '900',
  },
  categorySelectTitle: {
    ...type.bodyStrong,
    fontSize: 17,
    lineHeight: 22,
  },
  categorySelectCopy: {
    ...type.tiny,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 4,
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
    fontSize: 20,
    lineHeight: 25,
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
