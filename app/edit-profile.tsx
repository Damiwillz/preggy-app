import React, { useCallback, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { getMyProfile, updateMyProfile } from '@/services/profile';

function cleanDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split('/');

  if (parts.length !== 3) return null;

  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];

  if (!month || !day || !year) return null;

  return `${year}-${month}-${day}`;
}

export default function EditProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [babyNickname, setBabyNickname] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [pregnancyDays, setPregnancyDays] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    const profile = await getMyProfile();

    setFullName(profile.full_name || '');
    setBabyNickname(profile.baby_nickname || '');
    setDueDate(profile.due_date || '');
    setPregnancyWeek(String(profile.pregnancy_week ?? 24));
    setPregnancyDays(String(profile.pregnancy_days ?? 0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const saveProfile = async () => {
    try {
      setSaving(true);

      const nextDueDate = cleanDate(dueDate);

      if (dueDate.trim() && !nextDueDate) {
        Alert.alert('Invalid date', 'Use yyyy-mm-dd or mm/dd/yyyy for due date.');
        return;
      }

      await updateMyProfile({
        full_name: fullName.trim() || 'Mama',
        username: fullName.trim() || 'Mama',
        baby_nickname: babyNickname.trim() || 'Peanut',
        due_date: nextDueDate,
        pregnancy_week: Number(pregnancyWeek) || 0,
        pregnancy_days: Number(pregnancyDays) || 0,
      });

      Alert.alert('Profile saved', 'Your profile has been updated.', [
        {
          text: 'View Profile',
          onPress: () => router.replace('/(tabs)/profile' as never),
        },
      ]);
    } catch (error) {
      console.log('Profile save error:', error);
      Alert.alert('Save failed', 'We could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen bottomSpace={40}>
      <Header title="Edit Profile" back />

      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.sub}>Update your name, baby nickname, due date and pregnancy progress.</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Baby nickname</Text>
        <TextInput
          value={babyNickname}
          onChangeText={setBabyNickname}
          placeholder="Peanut"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Due date</Text>
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="yyyy-mm-dd or mm/dd/yyyy"
          placeholderTextColor={colors.muted}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
        />

        <View style={styles.two}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Week</Text>
            <TextInput
              value={pregnancyWeek}
              onChangeText={setPregnancyWeek}
              placeholder="24"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Days</Text>
            <TextInput
              value={pregnancyDays}
              onChangeText={setPregnancyDays}
              placeholder="0"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Button
          label={saving ? 'Saving...' : 'Save Profile'}
          onPress={saveProfile}
          style={{ marginTop: 10 }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.title,
    color: colors.ink,
    marginTop: 20,
  },
  sub: {
    ...type.body,
    color: colors.text,
    marginTop: 8,
    marginBottom: 18,
  },
  card: {
    gap: 12,
  },
  label: {
    ...type.section,
    color: colors.rose,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    ...type.body,
  },
  two: {
    flexDirection: 'row',
    gap: 12,
  },
});
