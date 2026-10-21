import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BriefItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route: string;
  ready: boolean;
  detail: string;
};

type BriefData = {
  visitorRules: number;
  comfortPreferences: number;
  delegatedTasks: number;
  recoveryLogs: number;
  familyDecisions: number;
};

const emptyBrief: BriefData = {
  visitorRules: 0,
  comfortPreferences: 0,
  delegatedTasks: 0,
  recoveryLogs: 0,
  familyDecisions: 0,
};

function parseObject(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === 'object'
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function parseArray(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function CareBriefScreen() {
  const { palette } = useAppTheme();
  const [brief, setBrief] = useState<BriefData>(emptyBrief);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadBrief() {
        setLoading(true);

        try {
          const [
            visitorRaw,
            comfortRaw,
            energyRaw,
            recoveryRaw,
            decisionsRaw,
          ] = await Promise.all([
            AsyncStorage.getItem('preggy:visitor-plan'),
            AsyncStorage.getItem('preggy:comfort-profile'),
            AsyncStorage.getItem('preggy:energy-budget'),
            AsyncStorage.getItem('preggy:recovery-check-ins'),
            AsyncStorage.getItem('preggy:family-decisions'),
          ]);

          const visitor = parseObject(visitorRaw) as {
            selectedRules?: unknown[];
          };

          const comfort = parseObject(comfortRaw) as {
            environment?: unknown[];
            support?: unknown[];
            avoid?: unknown[];
            safePerson?: string;
            reassurance?: string;
            extraNotes?: string;
          };

          const energy = parseObject(energyRaw) as {
            tasks?: Array<{
              owner?: string;
              completed?: boolean;
            }>;
          };

          const recovery = parseArray(recoveryRaw);
          const decisions = parseArray(decisionsRaw);

          const comfortCount =
            (Array.isArray(comfort.environment)
              ? comfort.environment.length
              : 0) +
            (Array.isArray(comfort.support)
              ? comfort.support.length
              : 0) +
            (Array.isArray(comfort.avoid)
              ? comfort.avoid.length
              : 0) +
            (comfort.safePerson?.trim() ? 1 : 0) +
            (comfort.reassurance?.trim() ? 1 : 0) +
            (comfort.extraNotes?.trim() ? 1 : 0);

          const delegatedTasks = Array.isArray(energy.tasks)
            ? energy.tasks.filter(
                (task) =>
                  task.owner === 'Delegate' &&
                  !task.completed
              ).length
            : 0;

          if (!active) return;

          setBrief({
            visitorRules: Array.isArray(
              visitor.selectedRules
            )
              ? visitor.selectedRules.length
              : 0,
            comfortPreferences: comfortCount,
            delegatedTasks,
            recoveryLogs: recovery.length,
            familyDecisions: decisions.length,
          });
        } catch (error) {
          console.log('Care brief load error:', error);

          if (active) {
            Alert.alert(
              'Could not load Care Brief',
              'Please try again.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void loadBrief();

      return () => {
        active = false;
      };
    }, [])
  );

  const items: BriefItem[] = useMemo(
    () => [
      {
        icon: 'shield-checkmark-outline',
        title: 'Visitor boundaries',
        copy: 'Rules shared with family and friends.',
        route: '/visitor-plan',
        ready: brief.visitorRules > 0,
        detail: `${brief.visitorRules} selected`,
      },
      {
        icon: 'heart-circle-outline',
        title: 'Comfort preferences',
        copy: 'What helps care feel safe and supportive.',
        route: '/comfort-profile',
        ready: brief.comfortPreferences > 0,
        detail: `${brief.comfortPreferences} saved`,
      },
      {
        icon: 'people-outline',
        title: 'Help requests',
        copy: 'Energy Budget tasks delegated to others.',
        route: '/energy-budget',
        ready: brief.delegatedTasks > 0,
        detail: `${brief.delegatedTasks} waiting`,
      },
      {
        icon: 'pulse-outline',
        title: 'Recovery check-ins',
        copy: 'Recent mood, energy, rest and comfort logs.',
        route: '/recovery-check-in',
        ready: brief.recoveryLogs > 0,
        detail: `${brief.recoveryLogs} recorded`,
      },
      {
        icon: 'git-branch-outline',
        title: 'Family decisions',
        copy: 'Important choices your family is discussing.',
        route: '/family-decisions',
        ready: brief.familyDecisions > 0,
        detail: `${brief.familyDecisions} saved`,
      },
    ],
    [brief]
  );

  const readyCount = items.filter((item) => item.ready).length;

  async function shareBrief() {
    if (!readyCount) {
      Alert.alert(
        'Your brief is empty',
        'Complete at least one Family Care section first.'
      );
      return;
    }

    const lines = [
      'Preggy Family Care Brief',
      '',
      'Here is our current care and support overview.',
      '',
      `Visitor boundaries: ${brief.visitorRules} selected`,
      `Comfort preferences: ${brief.comfortPreferences} saved`,
      `Help requests: ${brief.delegatedTasks} waiting`,
      `Recovery check-ins: ${brief.recoveryLogs} recorded`,
      `Family decisions: ${brief.familyDecisions} saved`,
      '',
      'Open the Preggy app for the complete details.',
    ];

    try {
      await Share.share({
        title: 'Preggy Family Care Brief',
        message: lines.join('\n'),
      });
    } catch (error) {
      console.log('Care brief share error:', error);
      Alert.alert('Could not share', 'Please try again.');
    }
  }

  return (
    <Screen bottomSpace={100}>
      <Header title="Care Brief" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="documents-outline"
              size={28}
              color={palette.onAccent}
            />
          </View>

          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>
              {readyCount}/5
            </Text>
            <Text style={styles.scoreLabel}>ready</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>ONE CLEAR OVERVIEW</Text>

        <Text style={styles.heroTitle}>
          Keep everyone on the same page.
        </Text>

        <Text style={styles.heroCopy}>
          Review your family’s current boundaries,
          preferences, decisions, and support needs.
        </Text>

        <View style={styles.progressBars}>
          {items.map((item) => (
            <View
              key={item.route}
              style={[
                styles.progressBar,
                {
                  backgroundColor: item.ready
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.22)',
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: palette.accent },
          ]}
        >
          CARE SECTIONS
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: palette.ink },
          ]}
        >
          Build your brief
        </Text>

        <Text
          style={[
            styles.sectionCopy,
            { color: palette.text },
          ]}
        >
          Open any section to add or update its details.
        </Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <AnimatedPressable
            key={item.route}
            onPress={() =>
              router.push(item.route as never)
            }
            style={[
              styles.itemCard,
              {
                backgroundColor: palette.surface,
                borderColor: item.ready
                  ? palette.success
                  : palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.itemIcon,
                {
                  backgroundColor: item.ready
                    ? palette.accentSoft
                    : palette.softSurface,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={
                  item.ready
                    ? palette.accent
                    : palette.muted
                }
              />
            </View>

            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: palette.ink },
                ]}
              >
                {item.title}
              </Text>

              <Text
                style={[
                  styles.itemCopy,
                  { color: palette.text },
                ]}
              >
                {item.copy}
              </Text>

              <Text
                style={[
                  styles.itemDetail,
                  {
                    color: item.ready
                      ? palette.success
                      : palette.muted,
                  },
                ]}
              >
                {item.ready
                  ? item.detail
                  : 'Not started'}
              </Text>
            </View>

            <View
              style={[
                styles.itemStatus,
                {
                  backgroundColor: item.ready
                    ? palette.success
                    : palette.accentSoft,
                },
              ]}
            >
              <Ionicons
                name={
                  item.ready
                    ? 'checkmark'
                    : 'arrow-forward'
                }
                size={18}
                color={
                  item.ready
                    ? '#FFFFFF'
                    : palette.accent
                }
              />
            </View>
          </AnimatedPressable>
        ))}
      </View>

      <AnimatedPressable
        disabled={loading}
        onPress={() => void shareBrief()}
        style={[
          styles.shareButton,
          {
            backgroundColor: palette.accent,
            opacity: loading ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons
          name="share-social-outline"
          size={21}
          color={palette.onAccent}
        />

        <Text
          style={[
            styles.shareText,
            { color: palette.onAccent },
          ]}
        >
          Share care overview
        </Text>

        <Ionicons
          name="arrow-forward"
          size={20}
          color={palette.onAccent}
        />
      </AnimatedPressable>

      <View
        style={[
          styles.noteCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={21}
          color={palette.accent}
        />

        <Text
          style={[
            styles.noteText,
            { color: palette.text },
          ]}
        >
          Your detailed Family Care information stays on
          this device unless you choose to share it.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 21,
    marginTop: 12,
    marginBottom: 25,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    minWidth: 65,
    minHeight: 53,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 22,
  },
  scoreLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.74)',
  },
  eyebrow: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.3,
    marginTop: 25,
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    marginTop: 5,
  },
  heroCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 22,
    marginTop: 8,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 20,
  },
  progressBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  sectionHeading: {
    marginBottom: 13,
  },
  sectionEyebrow: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 2,
  },
  sectionCopy: {
    ...type.small,
    marginTop: 4,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    minHeight: 105,
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...type.bodyStrong,
  },
  itemCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 2,
  },
  itemDetail: {
    ...type.tiny,
    marginTop: 5,
  },
  itemStatus: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    minHeight: 59,
    borderRadius: 21,
    paddingHorizontal: 17,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  shareText: {
    ...type.bodyStrong,
    flex: 1,
    textAlign: 'center',
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  noteText: {
    ...type.small,
    flex: 1,
    lineHeight: 20,
  },
});
