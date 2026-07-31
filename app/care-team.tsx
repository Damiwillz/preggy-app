import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type HospitalInfo = {
  hospitalName?: string;
  careProvider?: string;
  phone?: string;
  address?: string;
  updatedAt?: number | null;
};

type EmergencyContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  note?: string;
};

const HOSPITAL_KEY = 'preggy:hospital-info';
const CONTACTS_KEY = 'preggy:emergency-contacts';
const QUESTIONS_KEY = 'preggy:doctor-questions';

function readJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function cleanPhone(value?: string) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function formatUpdatedAt(value?: number | null) {
  if (!value) return 'Not saved yet';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function HubCard({
  icon,
  kicker,
  title,
  copy,
  action,
  onPress,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  kicker: string;
  title: string;
  copy: string;
  action: string;
  onPress: () => void;
  palette: ReturnType<typeof useAppTheme>['palette'];
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.hubCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.hubIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={24} color={palette.accent} />
      </View>

      <View style={styles.hubText}>
        <Text style={[styles.hubKicker, { color: palette.accent }]}>{kicker}</Text>
        <Text style={[styles.hubTitle, { color: palette.ink }]}>{title}</Text>
        <Text style={[styles.hubCopy, { color: palette.text }]}>{copy}</Text>
      </View>

      <View style={[styles.hubArrow, { backgroundColor: palette.canvas }]}>
        <Ionicons name="chevron-forward" size={19} color={palette.accent} />
      </View>

      <Text style={[styles.hubAction, { color: palette.accent }]}>{action}</Text>
    </AnimatedPressable>
  );
}

export default function CareTeamScreen() {
  const { palette } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<HospitalInfo>({});
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [questionCount, setQuestionCount] = useState(0);

  const mainContact = useMemo(() => {
    return (
      contacts.find((contact) => contact.role === 'Doctor') ||
      contacts.find((contact) => contact.role === 'Hospital') ||
      contacts[0]
    );
  }, [contacts]);

  const readinessScore = useMemo(() => {
    let score = 0;

    if (hospital.hospitalName || hospital.careProvider) score += 34;
    if (contacts.length > 0) score += 33;
    if (questionCount > 0) score += 33;

    return score;
  }, [contacts.length, hospital.careProvider, hospital.hospitalName, questionCount]);

  const loadCareTeam = useCallback(async () => {
    setLoading(true);

    try {
      const [savedHospital, savedContacts, savedQuestions] = await Promise.all([
        AsyncStorage.getItem(HOSPITAL_KEY),
        AsyncStorage.getItem(CONTACTS_KEY),
        AsyncStorage.getItem(QUESTIONS_KEY),
      ]);

      const nextHospital = readJson<HospitalInfo>(savedHospital, {});
      const nextContacts = readJson<EmergencyContact[]>(savedContacts, []);
      const nextQuestions = readJson<unknown[]>(savedQuestions, []);

      setHospital(nextHospital && typeof nextHospital === 'object' ? nextHospital : {});
      setContacts(Array.isArray(nextContacts) ? nextContacts : []);
      setQuestionCount(Array.isArray(nextQuestions) ? nextQuestions.length : 0);
    } catch (error) {
      console.log('Care team load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCareTeam();
    }, [loadCareTeam])
  );

  function callMainContact() {
    const phone = cleanPhone(mainContact?.phone || hospital.phone);

    if (!phone) {
      router.push('/emergency-contacts' as never);
      return;
    }

    Linking.openURL(`tel:${phone}`).catch(() => {
      router.push('/emergency-contacts' as never);
    });
  }

  return (
    <Screen bottomSpace={70}>
      <Header title="Care Team" back />

      <View style={[styles.hero, { backgroundColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: palette.onAccent }]}>
            <Ionicons name="people-outline" size={32} color={palette.accent} />
          </View>

          <View style={[styles.scoreBadge, { backgroundColor: palette.onAccent }]}>
            <Text style={[styles.scoreText, { color: palette.accent }]}>{readinessScore}%</Text>
          </View>
        </View>

        <Text style={[styles.eyebrow, { color: palette.onAccent }]}>CARE HUB</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>Your support circle</Text>
        <Text style={[styles.subtitle, { color: palette.onAccent }]}>
          Keep your doctor, hospital, emergency contacts, and visit questions easy to reach.
        </Text>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: `${readinessScore}%`, backgroundColor: palette.onAccent }]} />
        </View>
      </View>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Loading care team...</Text>
        </View>
      ) : (
        <>
          <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View>
              <Text style={[styles.summaryKicker, { color: palette.accent }]}>QUICK VIEW</Text>
              <Text style={[styles.summaryTitle, { color: palette.ink }]}>
                {hospital.hospitalName || 'No hospital saved yet'}
              </Text>
              <Text style={[styles.summaryCopy, { color: palette.text }]}>
                {hospital.careProvider
                  ? `${hospital.careProvider} • Updated ${formatUpdatedAt(hospital.updatedAt)}`
                  : `Updated ${formatUpdatedAt(hospital.updatedAt)}`}
              </Text>
            </View>

            <AnimatedPressable onPress={callMainContact} style={[styles.callButton, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name="call-outline" size={20} color={palette.accent} />
              <Text style={[styles.callText, { color: palette.accent }]}>Call</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <Text style={[styles.statValue, { color: palette.ink }]}>{contacts.length}</Text>
              <Text style={[styles.statLabel, { color: palette.text }]}>Contacts</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <Text style={[styles.statValue, { color: palette.ink }]}>{questionCount}</Text>
              <Text style={[styles.statLabel, { color: palette.text }]}>Questions</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: palette.text }]}>MANAGE</Text>

          <HubCard
            palette={palette}
            icon="business-outline"
            kicker="BIRTH PLACE"
            title="Hospital info"
            copy="Save clinic name, provider, phone number, address, and notes."
            action="Edit hospital"
            onPress={() => router.push('/hospital-info' as never)}
          />

          <HubCard
            palette={palette}
            icon="call-outline"
            kicker="SAFETY"
            title="Emergency contacts"
            copy="Keep doctor, hospital, partner, and family numbers close."
            action="Manage contacts"
            onPress={() => router.push('/emergency-contacts' as never)}
          />

          <HubCard
            palette={palette}
            icon="clipboard-outline"
            kicker="VISITS"
            title="Doctor questions"
            copy="Write questions before appointments so nothing gets forgotten."
            action="Open questions"
            onPress={() => router.push('/doctor-visit-pack' as never)}
          />

          <HubCard
            palette={palette}
            icon="shield-checkmark-outline"
            kicker="URGENT HELP"
            title="Safety center"
            copy="A simple place for urgent reminders and emergency guidance."
            action="Open safety"
            onPress={() => router.push('/safety-center' as never)}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 24,
    marginTop: 18,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    minWidth: 72,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  scoreText: {
    ...type.bodyStrong,
    fontSize: 20,
  },
  eyebrow: {
    ...type.small,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.8,
    marginTop: 20,
  },
  title: {
    ...type.title,
    fontSize: 34,
    lineHeight: 38,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 10,
    opacity: 0.86,
  },
  track: {
    height: 9,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 22,
  },
  fill: {
    height: '100%',
    borderRadius: 20,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryKicker: {
    ...type.small,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    ...type.title,
    fontSize: 24,
    marginTop: 2,
  },
  summaryCopy: {
    ...type.small,
    marginTop: 4,
  },
  callButton: {
    marginLeft: 'auto',
    minWidth: 76,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  callText: {
    ...type.small,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  statValue: {
    ...type.title,
    fontSize: 27,
  },
  statLabel: {
    ...type.small,
    marginTop: 2,
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 10,
  },
  hubCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hubIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubText: {
    flex: 1,
  },
  hubKicker: {
    ...type.tiny,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  hubTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginTop: 2,
  },
  hubCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  hubArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubAction: {
    ...type.tiny,
    position: 'absolute',
    right: 18,
    bottom: 12,
  },
});
