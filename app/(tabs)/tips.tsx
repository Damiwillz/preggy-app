import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getPublishedArticles,
  type Article,
} from '@/services/articles';

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

function getArticleImage(imageKey?: string | null) {
  const key = normalizeImageKey(imageKey);

  return articleImages[key] ?? articleImages.featured;
}

export default function TipsScreen() {
  const params = useLocalSearchParams<{
    fromTools?: string;
  }>();

  const fromTools = params.fromTools === '1';
  const { palette } = useAppTheme();

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setErrorText('');

    try {
      const data = await getPublishedArticles();
      setArticles(data);
    } catch (error) {
      console.log('Tips articles error:', error);
      setErrorText('Could not load guidance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setErrorText('');

      getPublishedArticles()
        .then((data) => {
          if (active) {
            setArticles(data);
          }
        })
        .catch((error) => {
          console.log('Tips articles error:', error);

          if (active) {
            setErrorText(
              'Could not load guidance. Please try again.'
            );
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const categories = useMemo(() => {
    const articleCategories = articles
      .map((article) => article.category)
      .filter(Boolean);

    return ['All', ...Array.from(new Set(articleCategories))];
  }, [articles]);

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        category === 'All' || article.category === category;

      const searchableText = [
        article.title,
        article.subtitle,
        article.category,
      ]
        .join(' ')
        .toLowerCase();

      return (
        matchesCategory &&
        (!cleanQuery || searchableText.includes(cleanQuery))
      );
    });
  }, [articles, category, query]);

  const featuredArticle = useMemo(
    () =>
      filtered.find((article) => article.featured) ??
      filtered[0] ??
      null,
    [filtered]
  );

  const libraryArticles = useMemo(
    () =>
      featuredArticle
        ? filtered.filter(
            (article) => article.id !== featuredArticle.id
          )
        : filtered,
    [featuredArticle, filtered]
  );

  function openArticle(article: Article) {
    router.push(article.route as never);
  }

  return (
    <Screen bottomSpace={115}>
      <Header
        title={fromTools ? 'Learn' : 'Preggy'}
        back={fromTools}
      />

      <View style={styles.intro}>
        <View style={styles.introText}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            TRUSTED GUIDANCE
          </Text>

          <Text style={[styles.title, { color: palette.ink }]}>
            Learn at your pace
          </Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            Calm, practical guidance for pregnancy, birth and early
            parenthood.
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/ai-chat' as never)}
          style={[
            styles.askButton,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="sparkles-outline"
            size={23}
            color={palette.accent}
          />
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.search,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.searchIcon,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={palette.accent}
          />
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search articles and topics"
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { color: palette.ink }]}
          returnKeyType="search"
        />

        {query ? (
          <AnimatedPressable
            onPress={() => setQuery('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={palette.muted}
            />
          </AnimatedPressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categories.map((item) => {
          const selected = item === category;

          return (
            <AnimatedPressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.category,
                {
                  backgroundColor: selected
                    ? palette.accent
                    : palette.surface,
                  borderColor: selected
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selected
                      ? '#FFFFFF'
                      : palette.ink,
                  },
                ]}
              >
                {item}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <ActivityIndicator color={palette.accent} />

          <Text style={[styles.stateTitle, { color: palette.ink }]}>
            Preparing your library
          </Text>

          <Text style={[styles.stateCopy, { color: palette.text }]}>
            Loading pregnancy guidance...
          </Text>
        </View>
      ) : errorText ? (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.stateIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={27}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.stateTitle, { color: palette.ink }]}>
            Guidance is unavailable
          </Text>

          <Text style={[styles.stateCopy, { color: palette.text }]}>
            {errorText}
          </Text>

          <AnimatedPressable
            onPress={() => void loadArticles()}
            style={[
              styles.retryButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </AnimatedPressable>
        </View>
      ) : !featuredArticle ? (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.stateIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={27}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.stateTitle, { color: palette.ink }]}>
            No articles found
          </Text>

          <Text style={[styles.stateCopy, { color: palette.text }]}>
            Try another search or topic.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: palette.accent }]}>
            FEATURED FOR YOU
          </Text>

          <AnimatedPressable
            onPress={() => openArticle(featuredArticle)}
            style={[
              styles.featuredCard,
              { borderColor: palette.line },
            ]}
          >
            <Image
              source={getArticleImage(featuredArticle.image_key)}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />

            <View
              style={[
                styles.featuredOverlay,
                {
                  backgroundColor: palette.isDark
                    ? 'rgba(9,5,7,0.56)'
                    : 'rgba(30,16,22,0.39)',
                },
              ]}
            />

            <View style={styles.featuredTop}>
              <View style={styles.featuredBadge}>
                <Ionicons
                  name="sparkles"
                  size={13}
                  color="#FFFFFF"
                />

                <Text style={styles.featuredBadgeText}>
                  EDITOR’S PICK
                </Text>
              </View>

              <View style={styles.readBadge}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="#FFFFFF"
                />

                <Text style={styles.readBadgeText}>
                  {featuredArticle.read_time}
                </Text>
              </View>
            </View>

            <View style={styles.featuredContent}>
              <Text style={styles.featuredCategory}>
                {featuredArticle.category.toUpperCase()}
              </Text>

              <Text style={styles.featuredTitle}>
                {featuredArticle.title}
              </Text>

              <Text
                style={styles.featuredSubtitle}
                numberOfLines={2}
              >
                {featuredArticle.subtitle}
              </Text>

              <View style={styles.featuredOpen}>
                <Text style={styles.featuredOpenText}>
                  Read article
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </AnimatedPressable>

          {libraryArticles.length > 0 ? (
            <>
              <View style={styles.libraryHeader}>
                <View>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: palette.accent },
                    ]}
                  >
                    YOUR LIBRARY
                  </Text>

                  <Text
                    style={[
                      styles.libraryTitle,
                      { color: palette.ink },
                    ]}
                  >
                    Explore guidance
                  </Text>
                </View>

                <Text
                  style={[
                    styles.libraryCount,
                    { color: palette.muted },
                  ]}
                >
                  {libraryArticles.length} articles
                </Text>
              </View>

              <View style={styles.articleGrid}>
                {libraryArticles.map((article) => (
                  <AnimatedPressable
                    key={article.id}
                    onPress={() => openArticle(article)}
                    style={[
                      styles.articleCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <Image
                      source={getArticleImage(article.image_key)}
                      style={styles.articleImage}
                      resizeMode="cover"
                    />

                    <View style={styles.articleContent}>
                      <Text
                        style={[
                          styles.articleMeta,
                          { color: palette.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {article.category} · {article.read_time}
                      </Text>

                      <Text
                        style={[
                          styles.articleTitle,
                          { color: palette.ink },
                        ]}
                        numberOfLines={3}
                      >
                        {article.title}
                      </Text>

                      <View style={styles.articleFooter}>
                        <Text
                          style={[
                            styles.articleOpen,
                            { color: palette.accent },
                          ]}
                        >
                          Open
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={15}
                          color={palette.accent}
                        />
                      </View>
                    </View>
                  </AnimatedPressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}

      <View
        style={[
          styles.medicalNotice,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="medical-outline"
          size={22}
          color={palette.accent}
        />

        <Text
          style={[
            styles.medicalNoticeText,
            { color: palette.text },
          ]}
        >
          Preggy provides general education, not medical diagnosis.
          Contact your healthcare professional about personal concerns.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    minHeight: 132,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  introText: {
    flex: 1,
    paddingRight: 15,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.25,
  },
  title: {
    ...type.hero,
    fontSize: 35,
    lineHeight: 42,
    letterSpacing: -1,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    marginTop: 7,
  },
  askButton: {
    width: 53,
    height: 53,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    width: 39,
    height: 39,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    ...type.body,
    flex: 1,
    paddingHorizontal: 11,
    paddingVertical: 0,
  },
  clearButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categories: {
    gap: 8,
    paddingVertical: 17,
    paddingRight: 5,
  },
  category: {
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    ...type.small,
  },
  sectionLabel: {
    ...type.section,
    letterSpacing: 1.2,
    marginBottom: 9,
  },
  featuredCard: {
    height: 345,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredTop: {
    zIndex: 2,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    minHeight: 32,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredBadgeText: {
    ...type.tiny,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  readBadge: {
    minHeight: 32,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(20,10,14,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readBadgeText: {
    ...type.tiny,
    color: '#FFFFFF',
  },
  featuredContent: {
    zIndex: 2,
    padding: 21,
  },
  featuredCategory: {
    ...type.section,
    color: 'rgba(255,255,255,0.78)',
  },
  featuredTitle: {
    ...type.title,
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 33,
    marginTop: 5,
  },
  featuredSubtitle: {
    ...type.small,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 315,
  },
  featuredOpen: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  featuredOpenText: {
    ...type.small,
    color: '#FFFFFF',
  },
  libraryHeader: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  libraryTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 3,
  },
  libraryCount: {
    ...type.tiny,
    marginBottom: 4,
  },
  articleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  articleCard: {
    width: '48.5%',
    minHeight: 255,
    borderRadius: 23,
    borderWidth: 1,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 122,
  },
  articleContent: {
    flex: 1,
    padding: 13,
  },
  articleMeta: {
    ...type.tiny,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  articleTitle: {
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
  },
  articleFooter: {
    marginTop: 'auto',
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  articleOpen: {
    ...type.tiny,
  },
  stateCard: {
    minHeight: 250,
    borderRadius: 27,
    borderWidth: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIcon: {
    width: 55,
    height: 55,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginTop: 13,
    textAlign: 'center',
  },
  stateCopy: {
    ...type.small,
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginTop: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    ...type.small,
    color: '#FFFFFF',
  },
  medicalNotice: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 15,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medicalNoticeText: {
    ...type.small,
    flex: 1,
    marginLeft: 10,
    lineHeight: 19,
  },
});
