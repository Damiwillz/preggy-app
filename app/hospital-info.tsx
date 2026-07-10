import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

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

const STORAGE_KEY = 'preggy:hospital-info';

const emptyInfo: HospitalInfo = {
  hospitalName: '',
  address: '',
  careProvider: '',
  phone: '',
  note: '',
  updatedAt: null,
};

function formatUpdatedAt(value: number | null) {
  if (!value) return 'Not saved yet';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HospitalInfoScreen() {
  const { palette } = useAppTheme();

  const [info, setInfo] = useState<HospitalInfo>(emptyInfo);
  const [hospitalName, setHospitalName] = useState('');
  const [address, setAddress] = useState('');
  const [careProvider, setCareProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const completion = useMemo(() => {
    const fields = [hospitalName, address, careProvider, phone, note];
    const filled = fields.filter((item) => item.trim().length > 0).length;

    return Math.round((filled / fields.length) * 100);
  }, [address, careProvider, hospitalName, note, phone]);

  useEffect(() => {
    async function loadInfo() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : emptyInfo;

        if (parsed && typeof parsed === 'object') {
          const next = { ...emptyInfo, ...parsed };

          setInfo(next);
          setHospitalName(next.hospitalName);
          setAddress(next.address);
          setCareProvider(next.careProvider);
          setPhone(next.phone);
          setNote(next.note);
        }
      } catch (error) {
        console.log('Hospital info load error:', error);
      }
    }

    void loadInfo();
  }, []);

  async function saveInfo() {
    const next: HospitalInfo = {
      hospitalName: hospitalName.trim(),
      address: address.trim(),
      careProvider: careProvider.trim(),
      phone: phone.trim(),
      note: note.trim(),
      updatedAt: Date.now(),
    };

    if (!next.hospitalName && !next.address && !next.careProvider && !next.phone && !next.note) {
      Alert.alert('Add hospital info', 'Add at least one detail before saving.');
      return;
    }

    setInfo(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      Alert.alert('Saved', 'Your hospital information has been saved.');
    } catch (error) {
      console.log('Hospital info save error:', error);
    }
  }

  function callHospital() {
    const clean = phone.replace(/[^\d+]/g, '');

    if (!clean) {
      Alert.alert('Phone number unavailable', 'Add a valid phone number first.');
      return;
    }

    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Could not call', 'Your device could not open the phone app.');
    });
  }

  function resetInfo() {
    Alert.alert('Clear hospital info?', 'This will remove the saved hospital details.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setInfo(emptyInfo);
          setHospitalName('');
          setAddress('');
          setCareProvider('');
          setPhone('');
          setNote('');
          void AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>BIRTH PLACE</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Hospital Info</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Keep your hospital, clinic, and care provider details in one place.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="business-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>SAVED PLACE</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {info.hospitalName || 'No hospital saved'}
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              Updated {formatUpdatedAt(info.updatedAt)}
            </Text>
          </View>

          <View style={[styles.percentBadge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.percentText, { color: palette.onAccent }]}>{completion}%</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.progressFill, { width: `${completion}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>CARE DETAILS</Text>

          <TextInput
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="Hospital or clinic name"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <TextInput
            value={careProvider}
            onChangeText={setCareProvider}
            placeholder="Doctor or midwife"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={palette.muted}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.noteInput,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Delivery instructions or notes"
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.noteInput,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <View style={styles.actionRow}>
            <AnimatedPressable
              onPress={saveInfo}
              style={[styles.primaryButton, { backgroundColor: palette.accent }]}
            >
              <Ionicons name="save-outline" size={19} color={palette.onAccent} />
              <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>Save</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={callHospital}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.line,
                },
              ]}
            >
              <Ionicons name="call-outline" size={19} color={palette.accent} />
              <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Call</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>QUICK VIEW</Text>

          <View style={styles.summaryList}>
            <InfoRow icon="business-outline" label="Place" value={hospitalName || 'Not added'} />
            <InfoRow icon="person-outline" label="Care provider" value={careProvider || 'Not added'} />
            <InfoRow icon="call-outline" label="Phone" value={phone || 'Not added'} />
            <InfoRow icon="location-outline" label="Address" value={address || 'Not added'} />
          </View>

          <AnimatedPressable
            onPress={resetInfo}
            style={[styles.clearButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.clearText, { color: palette.accent }]}>Clear saved info</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.infoRow, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
      <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: palette.ink }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 26,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  percentBadge: {
    minWidth: 48,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  percentText: {
    ...type.tiny,
    fontWeight: '900',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  formCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    ...type.section,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...type.bodyStrong,
    fontSize: 15,
  },
  noteInput: {
    minHeight: 86,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 52,
    flex: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 52,
    minWidth: 104,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  summaryCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  summaryList: {
    gap: 10,
    marginTop: 14,
  },
  infoRow: {
    minHeight: 70,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 3,
  },
  infoValue: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
  },
  clearButton: {
    minHeight: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  clearText: {
    ...type.small,
    fontWeight: '900',
  },
});
