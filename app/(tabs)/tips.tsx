import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { getPublishedArticles, type Article } from '@/services/articles';

const articleImages: Record<string, number> = {
  status: require('../../assets/images/tips-status-hero.jpg'),
  yoga: require('../../assets/images/tips-yoga-hero.jpg'),
  sanctuary: require('../../assets/images/tips-sanctuary-hero.jpg'),
  'hospital-bag': require('../../assets/images/tips-bag-baby.jpg'),
};

function getArticleImage(imageKey: string) {
  return articleImages[imageKey] ?? articleImages.status;
}

export default function TipsScreen() {
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
          if (mounted) {
            setArticles(data);
          }
        })
        .catch((error) => {
          console.log('Tips articles error:', error);

          if (mounted) {
            setErrorText('Could not load articles. Please try again.');
          }
        })
        .finally(() => {
          if (mounted) {
            setLoading(false);
          }
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
          <Text style={styles.eyebrow}>LIVE GUIDANCE</Text>
          <Text style={styles.title}>Daily Guidance</Text>
        </View>

        <View style={styles.savedCircle}>
          <Ionicons name="bookmark-outline" size={21} color={colors.plum} />
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={21} color={colors.muted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search guidance, movement, or prep..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        {query.length > 0 && (
          <AnimatedPressable onPress={() => setQuery('')} style={styles.clearButton}>
            <Ionicons name="close" size={16} color={colors.text} />
          </AnimatedPressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item) => (
          <AnimatedPressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.chip, category === item && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
          </AnimatedPressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.plum} />
          <Text style={styles.emptyTitle}>Loading articles...</Text>
          <Text style={styles.emptyCopy}>Fetching live guidance from Supabase.</Text>
        </View>
      ) : errorText ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={38} color={colors.muted} />
          <Text style={styles.emptyTitle}>Could not load articles</Text>
          <Text style={styles.emptyCopy}>{errorText}</Text>

          <AnimatedPressable
            onPress={() => {
              setLoading(true);
              setErrorText('');

              getPublishedArticles()
                .then(setArticles)
                .catch(() => setErrorText('Could not load articles. Please try again.'))
                .finally(() => setLoading(false));
            }}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </AnimatedPressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="leaf-outline" size={38} color={colors.muted} />
          <Text style={styles.emptyTitle}>Nothing found</Text>
          <Text style={styles.emptyCopy}>Try another search or category.</Text>
        </View>
      ) : (
        filtered.map((article) =>
          article.featured ? (
            <AnimatedPressable key={article.id} onPress={() => openArticle(article)} style={styles.featured}>
              <Image source={getArticleImage(article.image_key)} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <View style={styles.overlay} />

              <View style={styles.featuredText}>
                <Text style={styles.featuredBadge}>FEATURED</Text>
                <Text style={styles.featuredTitle}>{article.title}</Text>
                <Text style={styles.featuredSubtitle}>{article.subtitle}</Text>

                <View style={styles.openRow}>
                  <Text style={styles.openText}>Open today’s view</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </View>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable key={article.id} onPress={() => openArticle(article)} style={styles.article}>
              <Image source={getArticleImage(article.image_key)} style={styles.articleImage} resizeMode="cover" />

              <View style={styles.articleBody}>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {article.category} • {article.read_time}
                  </Text>

                  <Ionicons
                    name="arrow-up-outline"
                    size={18}
                    color={colors.plum}
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </View>

                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSubtitle}>{article.subtitle}</Text>
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
    color: colors.rose,
  },
  title: {
    ...type.title,
    fontSize: 30,
    color: colors.ink,
    marginTop: 3,
  },
  savedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  search: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    paddingVertical: 0,
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.softSurface,
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
    backgroundColor: '#F4EEEB',
  },
  chipActive: {
    backgroundColor: colors.plum,
  },
  chipText: {
    ...type.small,
    color: '#54484A',
  },
  chipTextActive: {
    color: '#fff',
  },
  featured: {
    height: 300,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 22,
    justifyContent: 'flex-end',
    backgroundColor: colors.line,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31,19,24,0.38)',
  },
  featuredText: {
    padding: 24,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBE3E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    ...type.tiny,
    color: colors.plum,
    marginBottom: 10,
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
  },
  article: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.line,
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
    color: colors.rose,
    fontWeight: '800',
  },
  articleTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 25,
    color: colors.ink,
    marginTop: 7,
  },
  articleSubtitle: {
    ...type.small,
    color: colors.text,
    marginTop: 7,
  },
  empty: {
    marginTop: 30,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
  },
  emptyTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    backgroundColor: colors.plum,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    ...type.small,
    color: '#fff',
    fontWeight: '800',
  },
});
