import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const warningSigns = [
  {
    icon: 'medical-outline',
    title: 'Severe headache or vision changes',
    copy: 'A headache that will not go away, blurred vision, flashes, or dizziness.',
  },
  {
    icon: 'heart-outline',
    title: 'Chest pain or trouble breathing',
    copy: 'Chest pressure, fast heartbeat, fainting, or sudden shortness of breath.',
  },
  {
    icon: 'thermometer-outline',
    title: 'Fever or severe vomiting',
    copy: 'Fever of 100.4 F / 38 C or higher, or vomiting that stops you from keeping fluids down.',
  },
  {
    icon: 'body-outline',
    title: 'Severe belly pain or swelling',
    copy: 'Pain that does not go away, or extreme swelling in the face, hands, leg, or arm.',
  },
  {
    icon: 'water-outline',
    title: 'Bleeding or fluid leaking',
    copy: 'More than spotting, fluid leaking, or discharge that smells bad.',
  },
  {
    icon: 'footsteps-outline',
    title: 'Baby movement slows or stops',
    copy: 'A clear change from your baby’s usual movement pattern.',
  },
  {
    icon: 'sad-outline',
    title: 'Thoughts of harm',
    copy: 'Thoughts about harming yourself, your baby, or feeling unable to stay safe.',
  },
];

const quickActions = [
  {
    icon: 'call-outline',
    title: 'Emergency Contacts',
    copy: 'Open saved doctor, partner, and hospital numbers.',
    route: '/emergency-contacts',
  },
  {
    icon: 'business-outline',
    title: 'Hospital Info',
    copy: 'Open clinic, hospital, and birth place details.',
    route: '/hospital-info',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Doctor Questions',
    copy: 'Review what you want to ask at your next visit.',
    route: '/doctor-questions',
  },
  {
    icon: 'medkit-outline',
    title: 'Medication',
    copy: 'Check current medicines and routine details.',
    route: '/medication',
  },
];

async function callEmergencyServices() {
  try {
    await Linking.openURL('tel:911');
  } catch {
    Alert.alert('Could not open phone', 'Please call your local emergency number now.');
  }
}

export default function SafetyCenterScreen() {
  const { palette } = useAppTheme();

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>SAFETY CENTER</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Know when to get help</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Quick warning signs and safety shortcuts for pregnancy and the year after birth.
        </Text>
      </View>

      <View style={[styles.urgentCard, { backgroundColor: palette.danger }]}>
        <View style={styles.urgentTop}>
          <View style={styles.urgentIcon}>
            <Ionicons name="warning-outline" size={25} color="#FFFFFF" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.urgentLabel}>URGENT</Text>
            <Text style={styles.urgentTitle}>If something feels wrong, get help now.</Text>
          </View>
        </View>

        <Text style={styles.urgentCopy}>
          Call your care team, go to emergency care, or call emergency services. Tell them you are pregnant or were pregnant within the last year.
        </Text>

        <AnimatedPressable onPress={callEmergencyServices} style={styles.callButton}>
          <Ionicons name="call" size={19} color={palette.danger} />
          <Text style={[styles.callButtonText, { color: palette.danger }]}>Call emergency services</Text>
        </AnimatedPressable>

        <Text style={styles.localNote}>
          Outside the U.S., call your local emergency number.
        </Text>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map((item) => (
          <ActionCard
            key={item.route}
            icon={item.icon as keyof typeof Ionicons.glyphMap}
            title={item.title}
            copy={item.copy}
            route={item.route}
          />
        ))}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.sectionLabel, { color: palette.accent }]}>WARNING SIGNS</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Seek care right away</Text>
          </View>

          <View style={[styles.countBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.countText, { color: palette.accent }]}>{warningSigns.length}</Text>
          </View>
        </View>

        {warningSigns.map((item, index) => (
          <WarningRow
            key={item.title}
            icon={item.icon as keyof typeof Ionicons.glyphMap}
            title={item.title}
            copy={item.copy}
            last={index === warningSigns.length - 1}
          />
        ))}
      </View>

      <View style={[styles.prepareCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>BE READY</Text>
        <Text style={[styles.prepareTitle, { color: palette.ink }]}>What to keep close</Text>

        <View style={styles.checkList}>
          <ChecklistItem text="Doctor or midwife phone number" />
          <ChecklistItem text="Hospital address and route" />
          <ChecklistItem text="Medication list and allergies" />
          <ChecklistItem text="Insurance or ID details" />
          <ChecklistItem text="A trusted person who can come with you" />
        </View>
      </View>

      <View style={[styles.disclaimer, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name="information-circle-outline" size={19} color={palette.accent} />
        <Text style={[styles.disclaimerText, { color: palette.text }]}>
          This screen does not replace medical advice. If you are unsure, contact your health care provider.
        </Text>
      </View>
    </Screen>
  );
}

function ActionCard({
  icon,
  title,
  copy,
  route,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route: string;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(route as never)}
      style={[styles.actionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={20} color={palette.accent} />
      </View>

      <Text style={[styles.actionTitle, { color: palette.ink }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.actionCopy, { color: palette.text }]} numberOfLines={2}>
        {copy}
      </Text>
    </AnimatedPressable>
  );
}

function WarningRow({
  icon,
  title,
  copy,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  last: boolean;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.warningRow, { borderBottomColor: last ? 'transparent' : palette.line }]}>
      <View style={[styles.warningIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={19} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.warningTitle, { color: palette.ink }]}>{title}</Text>
        <Text style={[styles.warningCopy, { color: palette.text }]}>{copy}</Text>
      </View>
    </View>
  );
}

function ChecklistItem({ text }: { text: string }) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.checkItem}>
      <View style={[styles.checkIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name="checkmark" size={15} color={palette.accent} />
      </View>
      <Text style={[styles.checkText, { color: palette.ink }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 10,
    marginBottom: 14,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.4,
  },
  title: {
    ...type.title,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    ...type.body,
    marginTop: 6,
  },
  urgentCard: {
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
  },
  urgentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  urgentIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 1.3,
  },
  urgentTitle: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 27,
    marginTop: 2,
  },
  urgentCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 14,
  },
  callButton: {
    minHeight: 54,
    borderRadius: 18,
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callButtonText: {
    ...type.bodyStrong,
  },
  localNote: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 10,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  actionCard: {
    width: '48.5%',
    minHeight: 142,
    borderWidth: 1,
    borderRadius: 22,
    padding: 13,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    ...type.bodyStrong,
  },
  actionCopy: {
    ...type.small,
    marginTop: 4,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  sectionLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },
  countBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  countText: {
    ...type.bodyStrong,
  },
  warningRow: {
    minHeight: 82,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    ...type.bodyStrong,
  },
  warningCopy: {
    ...type.small,
    marginTop: 2,
  },
  prepareCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  prepareTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
    marginBottom: 12,
  },
  checkList: {
    gap: 10,
  },
  checkItem: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    ...type.bodyStrong,
    flex: 1,
  },
  disclaimer: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  disclaimerText: {
    ...type.small,
    flex: 1,
  },
});
