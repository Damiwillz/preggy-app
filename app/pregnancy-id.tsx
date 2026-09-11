import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Share, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { getMyProfile, type UserProfile } from '@/services/profile';

type HospitalInfo = {
  hospitalName: string;
  address: string;
  careProvider: string;
  phone: string;
  note: string;
  updatedAt: number | null;
};

type EmergencyContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  note: string;
  createdAt: number;
};

const HOSPITAL_INFO_KEY = 'preggy:hospital-info';
const CONTACTS_KEY = 'preggy:emergency-contacts';

const emptyHospitalInfo: HospitalInfo = {
  hospitalName: '',
  address: '',
  careProvider: '',
  phone: '',
  note: '',
  updatedAt: null,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) return hex;

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);

  return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
}

function formatDate(value?: string | null) {
  if (!value) return 'Not saved';

  const date = new Date(value + 'T12:00:00');

  if (Number.isNaN(date.getTime())) return 'Not saved';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPregnancyProgress(profile: UserProfile | null) {
  if (profile?.due_date) {
    const dueDate = new Date(profile.due_date + 'T12:00:00');
    const today = new Date();

    if (!Number.isNaN(dueDate.getTime())) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
      const pregnancyDay = clamp(280 - daysRemaining, 0, 280);
      const week = clamp(Math.floor(pregnancyDay / 7) + 1, 1, 40);
      const day = pregnancyDay % 7;

      return { week, day };
    }
  }

  return {
    week: clamp(profile?.pregnancy_week ?? 24, 1, 40),
    day: clamp(profile?.pregnancy_days ?? 0, 0, 6),
  };
}

function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function buildShareText({
  profile,
  hospitalInfo,
  contact,
  week,
  day,
  dueDate,
}: {
  profile: UserProfile | null;
  hospitalInfo: HospitalInfo;
  contact: EmergencyContact | null;
  week: number;
  day: number;
  dueDate: string;
}) {
  const lines = [
    'Preggy Pregnancy ID',
    '',
    'Name: ' + (profile?.full_name || 'Not saved'),
    'Baby: ' + (profile?.baby_nickname || 'Not saved'),
    'Pregnancy: Week ' + week + ', Day ' + day,
    'Due date: ' + dueDate,
  ];

  if (hospitalInfo.hospitalName) lines.push('Hospital: ' + hospitalInfo.hospitalName);
  if (hospitalInfo.careProvider) lines.push('Care provider: ' + hospitalInfo.careProvider);
  if (hospitalInfo.address) lines.push('Hospital address: ' + hospitalInfo.address);
  if (hospitalInfo.phone) lines.push('Hospital phone: ' + hospitalInfo.phone);

  if (contact?.name) {
    lines.push('');
    lines.push('Emergency contact: ' + contact.name);
    lines.push('Role: ' + contact.role);
    lines.push('Phone: ' + contact.phone);
  }

  lines.push('');
  lines.push('Note: This is a personal pregnancy info card, not medical advice.');

  return lines.join('\n');
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.infoRow, { borderBottomColor: palette.line }]}>
      <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={19} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: palette.ink }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function PregnancyIdScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(emptyHospitalInfo);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadCard() {
        try {
          const [nextProfile, savedHospital, savedContacts] = await Promise.all([
            getMyProfile().catch(() => null),
            AsyncStorage.getItem(HOSPITAL_INFO_KEY),
            AsyncStorage.getItem(CONTACTS_KEY),
          ]);

          if (!active) return;

          const parsedHospital = savedHospital ? JSON.parse(savedHospital) : emptyHospitalInfo;
          const parsedContacts = savedContacts ? JSON.parse(savedContacts) : [];

          setProfile(nextProfile);
          setHospitalInfo(parsedHospital && typeof parsedHospital === 'object' ? { ...emptyHospitalInfo, ...parsedHospital } : emptyHospitalInfo);
          setContacts(Array.isArray(parsedContacts) ? parsedContacts : []);
        } catch (error) {
          console.log('Pregnancy ID load error:', error);
        }
      }

      void loadCard();

      return () => {
        active = false;
      };
    }, [])
  );

  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);

  const mainContact = useMemo(() => {
    return contacts.find((item) => item.role === 'Doctor') ||
      contacts.find((item) => item.role === 'Hospital') ||
      contacts.find((item) => item.role === 'Partner') ||
      contacts[0] ||
      null;
  }, [contacts]);

  const dueDate = formatDate(profile?.due_date);
  const displayName = profile?.full_name || 'Not saved yet';
  const babyName = profile?.baby_nickname || 'Baby';
  const hospitalName = hospitalInfo.hospitalName || 'Not saved yet';
  const careProvider = hospitalInfo.careProvider || 'Not saved yet';
  const contactName = mainContact ? mainContact.name + ' • ' + mainContact.role : 'Not saved yet';
  const phone = mainContact?.phone || hospitalInfo.phone || '';

  function callMainContact() {
    const number = cleanPhone(phone);

    if (!number) {
      Alert.alert('No phone saved', 'Add a hospital phone or emergency contact first.');
      return;
    }

    Linking.openURL('tel:' + number).catch(() => {
      Alert.alert('Could not call', 'Please check the saved phone number.');
    });
  }

  async function shareCard() {
    const message = buildShareText({
      profile,
      hospitalInfo,
      contact: mainContact,
      week: progress.week,
      day: progress.day,
      dueDate,
    });

    try {
      await Share.share({
        title: 'Preggy Pregnancy ID',
        message,
      });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  }

  return (
    <Screen bottomSpace={130}>
      <Header title="" back />

      <View style={styles.top}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGNANCY ID</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Quick info card</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Keep your pregnancy, hospital, and emergency details easy to share.
        </Text>
      </View>

      <LinearGradient
        colors={[
          palette.accent,
          withAlpha(palette.accent, 0.84),
          withAlpha(palette.accent, 0.66),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.idCard}
      >
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.onAccent }]}>PREGGY ID</Text>
            <Text style={[styles.cardName, { color: palette.onAccent }]}>{displayName}</Text>
          </View>

          <View style={styles.cardIcon}>
            <Ionicons name="shield-checkmark-outline" size={34} color={palette.onAccent} />
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <Text style={[styles.cardBaby, { color: palette.onAccent }]}>{babyName}</Text>
          <Text style={[styles.cardPregnancy, { color: palette.onAccent }]}>
            Week {progress.week} • Day {progress.day}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.cardSmallLabel, { color: palette.onAccent }]}>DUE DATE</Text>
            <Text style={[styles.cardSmallValue, { color: palette.onAccent }]}>{dueDate}</Text>
          </View>

          <View>
            <Text style={[styles.cardSmallLabel, { color: palette.onAccent }]}>CONTACT</Text>
            <Text style={[styles.cardSmallValue, { color: palette.onAccent }]} numberOfLines={1}>
              {phone || 'Not saved'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={shareCard}
          style={[styles.actionButton, { backgroundColor: palette.accent }]}
        >
          <Ionicons name="share-social-outline" size={19} color={palette.onAccent} />
          <Text style={[styles.actionText, { color: palette.onAccent }]}>Share card</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={callMainContact}
          style={[styles.actionButton, { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1 }]}
        >
          <Ionicons name="call-outline" size={19} color={palette.accent} />
          <Text style={[styles.actionText, { color: palette.accent }]}>Call</Text>
        </AnimatedPressable>
      </View>

      <View style={[styles.detailsCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>SAVED DETAILS</Text>

        <InfoRow icon="person-outline" label="Name" value={displayName} />
        <InfoRow icon="heart-outline" label="Baby" value={babyName} />
        <InfoRow icon="calendar-outline" label="Pregnancy" value={'Week ' + progress.week + ', Day ' + progress.day} />
        <InfoRow icon="time-outline" label="Due date" value={dueDate} />
        <InfoRow icon="business-outline" label="Hospital" value={hospitalName} />
        <InfoRow icon="medkit-outline" label="Care provider" value={careProvider} />
        <InfoRow icon="call-outline" label="Main contact" value={contactName} />
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          This card is for quick reference only. If something feels urgent, contact your provider or emergency services.
        </Text>
      </View>

      <View style={styles.linkGrid}>
        <AnimatedPressable
          onPress={() => router.push('/hospital-info' as never)}
          style={[styles.linkCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="business-outline" size={22} color={palette.accent} />
          <Text style={[styles.linkText, { color: palette.ink }]}>Edit hospital info</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/emergency-contacts' as never)}
          style={[styles.linkCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="call-outline" size={22} color={palette.accent} />
          <Text style={[styles.linkText, { color: palette.ink }]}>Edit contacts</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 18,
    marginBottom: 16,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 7,
  },
  idCard: {
    borderRadius: 32,
    padding: 20,
    minHeight: 245,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    ...type.section,
    opacity: 0.82,
  },
  cardName: {
    ...type.bodyStrong,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 5,
  },
  cardIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddle: {
    marginTop: 30,
  },
  cardBaby: {
    ...type.hero,
    fontSize: 39,
    lineHeight: 45,
  },
  cardPregnancy: {
    ...type.bodyStrong,
    marginTop: 5,
    opacity: 0.9,
  },
  cardFooter: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  cardSmallLabel: {
    ...type.tiny,
    opacity: 0.78,
  },
  cardSmallValue: {
    ...type.small,
    fontWeight: '900',
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    ...type.small,
    fontWeight: '900',
  },
  detailsCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 10,
  },
  infoRow: {
    minHeight: 67,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    ...type.tiny,
    marginBottom: 2,
  },
  infoValue: {
    ...type.small,
    fontWeight: '900',
  },
  noteCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
  },
  linkGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  linkCard: {
    flex: 1,
    minHeight: 98,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  linkText: {
    ...type.small,
    fontWeight: '900',
  },
});
