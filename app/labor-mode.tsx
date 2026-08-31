import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

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

type Shortcut = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route: string;
};

const HOSPITAL_INFO_KEY = 'preggy:hospital-info';
const CONTACTS_KEY = 'preggy:emergency-contacts';
const CHECKLIST_KEY = 'preggy:labor-mode-checklist';

const emptyHospitalInfo: HospitalInfo = {
  hospitalName: '',
  address: '',
  careProvider: '',
  phone: '',
  note: '',
  updatedAt: null,
};

const checklist = [
  { id: 'timer', label: 'Start timing contractions if they are coming in waves' },
  { id: 'provider', label: 'Call your provider if contractions feel regular or concerning' },
  { id: 'bag', label: 'Check hospital bag and documents' },
  { id: 'support', label: 'Tell your support person what is happening' },
  { id: 'movement', label: 'Notice baby movement and how your body feels' },
];

const shortcuts: Shortcut[] = [
  {
    icon: 'timer-outline',
    title: 'Contraction Timer',
    copy: 'Start timing waves',
    route: '/contraction-timer',
  },
  {
    icon: 'pulse-outline',
    title: 'Contraction History',
    copy: 'Review saved sessions',
    route: '/contraction-history',
  },
  {
    icon: 'business-outline',
    title: 'Hospital Info',
    copy: 'Address, provider and notes',
    route: '/hospital-info',
  },
  {
    icon: 'call-outline',
    title: 'Emergency Contacts',
    copy: 'Important numbers',
    route: '/emergency-contacts',
  },
  {
    icon: 'document-text-outline',
    title: 'Birth Preferences',
    copy: 'Your birth wishes',
    route: '/birth-preferences',
  },
  {
    icon: 'bag-handle-outline',
    title: 'Hospital Bag',
    copy: 'Packing checklist',
    route: '/hospital-bag-checklist',
  },
];

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) return hex;

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);

  return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
}

function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function ShortcutCard({ item }: { item: Shortcut }) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(item.route as never)}
      style={[styles.shortcutCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.shortcutIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={item.icon} size={22} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.shortcutTitle, { color: palette.ink }]}>{item.title}</Text>
        <Text style={[styles.shortcutCopy, { color: palette.text }]}>{item.copy}</Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color={palette.muted} />
    </AnimatedPressable>
  );
}

export default function LaborModeScreen() {
  const { palette } = useAppTheme();

  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(emptyHospitalInfo);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [readyItems, setReadyItems] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadLaborInfo() {
        try {
          const [savedHospital, savedContacts, savedChecklist] = await Promise.all([
            AsyncStorage.getItem(HOSPITAL_INFO_KEY),
            AsyncStorage.getItem(CONTACTS_KEY),
            AsyncStorage.getItem(CHECKLIST_KEY),
          ]);

          if (!active) return;

          const parsedHospital = savedHospital ? JSON.parse(savedHospital) : emptyHospitalInfo;
          const parsedContacts = savedContacts ? JSON.parse(savedContacts) : [];
          const parsedChecklist = savedChecklist ? JSON.parse(savedChecklist) : [];

          setHospitalInfo(parsedHospital && typeof parsedHospital === 'object' ? { ...emptyHospitalInfo, ...parsedHospital } : emptyHospitalInfo);
          setContacts(Array.isArray(parsedContacts) ? parsedContacts : []);
          setReadyItems(Array.isArray(parsedChecklist) ? parsedChecklist : []);
        } catch (error) {
          console.log('Labor mode load error:', error);
        }
      }

      void loadLaborInfo();

      return () => {
        active = false;
      };
    }, [])
  );

  const mainContact = useMemo(() => {
    return contacts.find((item) => item.role === 'Doctor') ||
      contacts.find((item) => item.role === 'Hospital') ||
      contacts[0] ||
      null;
  }, [contacts]);

  const phone = mainContact?.phone || hospitalInfo.phone || '';
  const contactName = mainContact?.name || hospitalInfo.careProvider || hospitalInfo.hospitalName || 'Care team';
  const hospitalName = hospitalInfo.hospitalName || 'Hospital details not saved yet';
  const progress = Math.round((readyItems.length / checklist.length) * 100);

  function callCareTeam() {
    const number = cleanPhone(phone);

    if (!number) {
      Alert.alert('No phone saved yet', 'Add your doctor, hospital, or emergency contact number first.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add contact', onPress: () => router.push('/emergency-contacts' as never) },
      ]);
      return;
    }

    Linking.openURL('tel:' + number).catch(() => {
      Alert.alert('Could not call', 'Please check the phone number and try again.');
    });
  }

  function toggleReady(id: string) {
    setReadyItems((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)).catch((error) => {
        console.log('Labor checklist save error:', error);
      });

      return next;
    });
  }

  return (
    <Screen bottomSpace={130}>
      <Header title="" back />

      <View style={styles.top}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>LABOR MODE</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Everything for the big moment</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Timer, contacts, hospital details, birth preferences, and bag checklist in one calm place.
        </Text>
      </View>

      <LinearGradient
        colors={[
          palette.accent,
          withAlpha(palette.accent, 0.82),
          withAlpha(palette.accent, 0.68),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>READY CHECK</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>{progress}% ready</Text>
            <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
              {hospitalName}
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="heart-circle-outline" size={42} color={palette.onAccent} />
          </View>
        </View>

        <View style={styles.heroButtons}>
          <AnimatedPressable onPress={() => router.push('/contraction-timer' as never)} style={styles.primaryHeroButton}>
            <Ionicons name="timer-outline" size={19} color={palette.accent} />
            <Text style={[styles.primaryHeroText, { color: palette.accent }]}>Start timer</Text>
          </AnimatedPressable>

          <AnimatedPressable onPress={callCareTeam} style={styles.secondaryHeroButton}>
            <Ionicons name="call-outline" size={19} color={palette.onAccent} />
            <Text style={[styles.secondaryHeroText, { color: palette.onAccent }]}>Call {contactName}</Text>
          </AnimatedPressable>
        </View>
      </LinearGradient>

      <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          This is a planning tool, not medical advice. If you feel worried, unwell, or unsafe, contact your care provider or emergency services.
        </Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>QUICK ACTIONS</Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>Open what you need</Text>
      </View>

      <View style={styles.shortcutList}>
        {shortcuts.map((item) => (
          <ShortcutCard key={item.route} item={item} />
        ))}
      </View>

      <View style={[styles.checkCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.checkHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.accent }]}>CALM CHECKLIST</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>What to do now</Text>
          </View>

          <View style={[styles.progressBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.progressBadgeText, { color: palette.accent }]}>{readyItems.length}/{checklist.length}</Text>
          </View>
        </View>

        {checklist.map((item) => {
          const done = readyItems.includes(item.id);

          return (
            <AnimatedPressable
              key={item.id}
              onPress={() => toggleReady(item.id)}
              style={[styles.checkRow, { backgroundColor: palette.canvas, borderColor: palette.line }]}
            >
              <Ionicons
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={23}
                color={done ? palette.accent : palette.muted}
              />
              <Text style={[styles.checkText, { color: done ? palette.ink : palette.text }]}>{item.label}</Text>
            </AnimatedPressable>
          );
        })}
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
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 7,
  },
  heroCard: {
    borderRadius: 32,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroLabel: {
    ...type.section,
    opacity: 0.82,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 37,
    lineHeight: 44,
    marginTop: 4,
  },
  heroCopy: {
    ...type.small,
    marginTop: 5,
    opacity: 0.9,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtons: {
    gap: 10,
    marginTop: 18,
  },
  primaryHeroButton: {
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryHeroButton: {
    minHeight: 50,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryHeroText: {
    ...type.small,
    fontWeight: '900',
  },
  secondaryHeroText: {
    ...type.small,
    fontWeight: '900',
  },
  noteCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
  },
  sectionHeading: {
    marginBottom: 10,
  },
  sectionEyebrow: {
    ...type.section,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 3,
  },
  shortcutList: {
    gap: 10,
    marginBottom: 16,
  },
  shortcutCard: {
    minHeight: 76,
    borderRadius: 24,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  shortcutCopy: {
    ...type.small,
    marginTop: 2,
  },
  checkCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 17,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  progressBadge: {
    minWidth: 48,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  progressBadgeText: {
    ...type.small,
    fontWeight: '900',
  },
  checkRow: {
    minHeight: 62,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
  },
});
