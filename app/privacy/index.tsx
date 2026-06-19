import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppSwitch } from '@/components/ui/AppSwitch';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

type ToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

const ToggleRow = ({ icon, label, value, onChange }: ToggleRowProps) => (
  <View style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={21} color="#725B61" />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowAction}>
      <AppSwitch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  </View>
);

const LinkRow = ({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) => (
  <AnimatedPressable onPress={onPress} style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={21} color={danger ? '#C92E3F' : '#725B61'} />
    </View>
    <Text style={[styles.rowLabel, danger && { color: '#C92E3F' }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#8B7D80" />
  </AnimatedPressable>
);

export default function DataPrivacyScreen() {
  const [healthSharing, setHealthSharing] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [location, setLocation] = useState(true);
  const [diagnostics, setDiagnostics] = useState(true);

  return (
    <Screen bottomSpace={110}>
      <Header title="Data Privacy" back />

      <View style={styles.encrypted}>
        <View style={styles.shield}>
          <Ionicons name="shield-checkmark" size={28} color="#7A5A61" />
        </View>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>Your data is encrypted</Text>
          <Text style={styles.heroCopy}>
            Preggers uses end-to-end encryption for all health logs. Only you and authorized providers can access your journey.
          </Text>
        </View>
      </View>

      <Text style={styles.section}>PERSONAL DATA CONTROL</Text>
      <View style={styles.card}>
        <View style={[styles.row, styles.tallRow]}>
          <View style={styles.rowIcon}>
            <Ionicons name="medkit-outline" size={21} color="#725B61" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Health Data Sharing</Text>
            <Text style={styles.detail}>Allow the app to securely sync your pregnancy milestones with your health provider.</Text>
          </View>
          <View style={styles.rowAction}>
            <AppSwitch value={healthSharing} onValueChange={setHealthSharing} accessibilityLabel="Health Data Sharing" />
          </View>
        </View>
        <LinkRow icon="download-outline" label="Download My Data" onPress={() => router.push('/privacy/download-data')} />
        <LinkRow
          icon="person-remove-outline"
          label="Delete My Account"
          danger
          onPress={() =>
            Alert.alert('Delete account?', 'This action permanently removes your pregnancy data.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive' },
            ])
          }
        />
      </View>

      <Text style={styles.section}>PERMISSIONS MANAGEMENT</Text>
      <View style={styles.card}>
        <ToggleRow
          icon="finger-print"
          label="Biometric Lock"
          value={biometric}
          onChange={(v) => {
            setBiometric(v);
            if (v) router.push('/privacy/biometric');
          }}
        />
        <ToggleRow icon="location-outline" label="Location Access" value={location} onChange={setLocation} />
        <ToggleRow icon="analytics-outline" label="Diagnostic Sharing" value={diagnostics} onChange={setDiagnostics} />
      </View>

      <View style={styles.policy}>
        <Text style={styles.policyTitle}>Your Privacy Matters</Text>
        <Text style={styles.policyCopy}>
          We believe health data should remain private and portable. Read our full policy to understand how we protect you.
        </Text>
        <AnimatedPressable onPress={() => Alert.alert('Privacy Policy', 'The full policy will open here in the production app.')}>
          <Text style={styles.policyLink}>View Full Privacy Policy  ↗</Text>
        </AnimatedPressable>
      </View>
      <Text style={styles.version}>PREGGERS SECURE V4.2.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  encrypted: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  shield: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FBE7E9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroTextBlock: {
    flex: 1,
    zIndex: 2,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    color: colors.ink,
  },
  heroCopy: {
    ...type.body,
    color: colors.text,
    lineHeight: 22,
    marginTop: 4,
  },
  watermark: {
    position: 'absolute',
    right: -26,
    top: 12,
    opacity: 0.42,
    zIndex: 0,
  },
  section: {
    ...type.section,
    color: colors.text,
    marginTop: 22,
    marginBottom: 8,
    letterSpacing: 2.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 7,
  },
  tallRow: {
    minHeight: 108,
  },
  rowAction: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#F9F0EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 16,
    flex: 1,
  },
  detail: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    paddingRight: 4,
  },
  policy: {
    marginTop: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  policyTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    color: colors.text,
  },
  policyCopy: {
    ...type.body,
    textAlign: 'center',
    color: colors.text,
    lineHeight: 22,
    marginTop: 8,
  },
  policyLink: {
    ...type.bodyStrong,
    color: colors.plum,
    marginTop: 12,
  },
  version: {
    ...type.tiny,
    color: colors.muted,
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: 24,
  },
});
