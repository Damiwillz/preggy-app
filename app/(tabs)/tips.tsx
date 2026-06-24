import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { getPublishedArticles, type Article } from '@/services/articles';

const articleImages: Record<string, number> = {
  status: require('../../assets/images/tips-status-hero.jpg'),
  'status-baby': require('../../assets/images/tips-status-baby.jpg'),

  yoga: require('../../assets/images/tips-yoga-hero.jpg'),
  'yoga-hero': require('../../assets/images/tips-yoga-hero.jpg'),
  'yoga-catcow': require('../../assets/images/tips-yoga-catcow.jpg'),
  'yoga-childpose': require('../../assets/images/tips-yoga-childpose.jpg'),
  'yoga-warrior': require('../../assets/images/tips-yoga-warrior.jpg'),

  sanctuary: require('../../assets/images/tips-sanctuary-hero.jpg'),

  bag: require('../../assets/images/tips-bag.jpg'),
  'hospital-bag': require('../../assets/images/tips-bag-baby.jpg'),
  'bag-baby': require('../../assets/images/tips-bag-baby.jpg'),
  'what-to-pack': require('../../assets/images/tips-bag.jpg'),

  exercise: require('../../assets/images/tips-exercise.jpg'),
  symptoms: require('../../assets/images/tips-symptoms.jpg'),
  foods: require('../../assets/images/tips-featured.jpg'),
  food: require('../../assets/images/tips-featured.jpg'),
  featured: require('../../assets/images/tips-featured.jpg'),
  pregnancy: require('../../assets/images/week12-baby.jpg'),
};

function normalizeImageKey(imageKey?: string | null) {
  return String(imageKey ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

function getArticleImage(imageKey: string) {
  const key = normalizeImageKey(imageKey);

  return articleImages[key] ?? articleImages.featured;
}

export default function TipsScreen() {
  const { palette } = useAppTheme();

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);
      setErrorText('');

      getPublishedArticles()
        .then((data) => {
          if (mounted) setArticles(data);
        })
        .catch((error) => {
          console.log('Tips articles error:', error);

          if (mounted) {
            setErrorText('Could not load articles. Please try again.');
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  const categories = useMemo(() => {
    const articleCategories = articles.map((article) => article.category);
    return ['All', ...Array.from(new Set(articleCategories))];
  }, [articles]);

  const filtered = useMemo(
    () =>
      articles.filter((article) => {
        const matchesCategory = category === 'All' || article.category === category;
        const haystack = `${article.title} ${article.subtitle} ${article.category}`.toLowerCase();

        return matchesCategory && haystack.includes(query.trim().toLowerCase());
      }),
    [articles, category, query]
  );

  function openArticle(article: Article) {
    router.push(article.route as never);
  }

  return (
    <Screen bottomSpace={110}>
      <Header />

      <View style={styles.headingRow}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>LIVE GUIDANCE</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Daily Guidance</Text>
        </View>

        <View style={[styles.savedCircle, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="bookmark-outline" size={21} color={palette.accent} />
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Ionicons name="search" size={21} color={palette.muted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search guidance, movement, or prep..."
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { color: palette.ink }]}
          returnKeyType="search"
        />

        {query.length > 0 && (
          <AnimatedPressable onPress={() => setQuery('')} style={[styles.clearButton, { backgroundColor: palette.softSurface }]}>
            <Ionicons name="close" size={16} color={palette.ink} />
          </AnimatedPressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item) => {
          const selected = category === item;

          return (
            <AnimatedPressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? palette.accent : palette.softSurface,
                  borderColor: selected ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? palette.onAccent : palette.ink }]}>
                {item}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Loading articles...</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>Fetching live guidance from Supabase.</Text>
        </View>
      ) : errorText ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="cloud-offline-outline" size={38} color={palette.muted} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Could not load articles</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>{errorText}</Text>

          <AnimatedPressable
            onPress={() => {
              setLoading(true);
              setErrorText('');

              getPublishedArticles()
                .then(setArticles)
                .catch(() => setErrorText('Could not load articles. Please try again.'))
                .finally(() => setLoading(false));
            }}
            style={[styles.retry, { backgroundColor: palette.accent }]}
          >
            <Text style={[styles.retryText, { color: palette.onAccent }]}>Try again</Text>
          </AnimatedPressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="leaf-outline" size={38} color={palette.muted} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Nothing found</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>Try another search or category.</Text>
        </View>
      ) : (
        filtered.map((article) =>
          article.featured ? (
            <AnimatedPressable key={article.id} onPress={() => openArticle(article)} style={styles.featured}>
              <Image source={getArticleImage(article.image_key)} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <View style={[styles.overlay, { backgroundColor: palette.isDark ? 'rgba(0,0,0,0.56)' : 'rgba(31,19,24,0.38)' }]} />

              <View style={styles.featuredText}>
                <Text style={[styles.featuredBadge, { backgroundColor: palette.accentSoft, color: palette.accent }]}>
                  FEATURED
                </Text>
                <Text style={styles.featuredTitle}>{article.title}</Text>
                <Text style={styles.featuredSubtitle}>{article.subtitle}</Text>

                <View style={styles.openRow}>
                  <Text style={styles.openText}>Open today’s view</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </View>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              key={article.id}
              onPress={() => openArticle(article)}
              style={[styles.article, { backgroundColor: palette.surface, borderColor: palette.line }]}
            >
              <Image source={getArticleImage(article.image_key)} style={styles.articleImage} resizeMode="cover" />

              <View style={styles.articleBody}>
                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: palette.accent }]}>
                    {article.category} • {article.read_time}
                  </Text>

                  <Ionicons
                    name="arrow-up-outline"
                    size={18}
                    color={palette.accent}
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </View>

                <Text style={[styles.articleTitle, { color: palette.ink }]}>{article.title}</Text>
                <Text style={[styles.articleSubtitle, { color: palette.text }]}>{article.subtitle}</Text>
              </View>
            </AnimatedPressable>
          )
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 30,
    marginTop: 3,
  },
  savedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  search: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    paddingVertical: 0,
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categories: {
    gap: 10,
    paddingVertical: 18,
    paddingRight: 24,
  },
  chip: {
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: {
    ...type.small,
    fontWeight: '800',
  },
  featured: {
    height: 300,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 22,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredText: {
    padding: 24,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    ...type.tiny,
    marginBottom: 10,
    fontWeight: '900',
  },
  featuredTitle: {
    ...type.title,
    fontSize: 25,
    color: '#fff',
  },
  featuredSubtitle: {
    ...type.body,
    color: '#fff',
    marginTop: 7,
    maxWidth: 320,
  },
  openRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openText: {
    ...type.small,
    color: '#fff',
    fontWeight: '800',
  },
  article: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },
  articleImage: {
    width: '100%',
    height: 190,
  },
  articleBody: {
    padding: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    ...type.small,
    fontWeight: '900',
  },
  articleTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 25,
    marginTop: 7,
  },
  articleSubtitle: {
    ...type.small,
    marginTop: 7,
    lineHeight: 19,
  },
  empty: {
    marginTop: 30,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyCopy: {
    ...type.small,
    marginTop: 4,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    ...type.small,
    fontWeight: '900',
  },
});
