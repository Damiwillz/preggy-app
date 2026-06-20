import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule: string | null;
  time_label: string | null;
  taken: boolean;
  created_at: string;
};

const defaultMedications = [
  {
    name: 'Prenatal Multi Vitamin',
    dosage: '1 capsule',
    schedule: 'Daily',
    time_label: '8:00 AM',
    taken: true,
  },
  {
    name: 'Folic Acid',
    dosage: '400mcg',
    schedule: 'Daily',
    time_label: '8:00 AM',
    taken: true,
  },
  {
    name: 'DHA Supplement',
    dosage: '200mg',
    schedule: 'Once daily',
    time_label: '12:30 PM',
    taken: false,
  },
  {
    name: 'Iron Supplement',
    dosage: '1 tablet',
    schedule: 'Daily',
    time_label: '12:30 PM',
    taken: false,
  },
];

export default function MedicationScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        Alert.alert('Login needed', 'Please log in to view your medications.');
        return;
      }

      const { data, error } = await supabase
        .from('medications')
        .select('id,user_id,name,dosage,schedule,time_label,taken,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMedications(data as Medication[]);
        return;
      }

      const seedRows = defaultMedications.map((item) => ({
        user_id: userId,
        ...item,
      }));

      const { data: created, error: createError } = await supabase
        .from('medications')
        .insert(seedRows)
        .select('id,user_id,name,dosage,schedule,time_label,taken,created_at')
        .order('created_at', { ascending: true });

      if (createError) throw createError;

      setMedications((created as Medication[]) ?? []);
    } catch (error) {
      console.log('Medication load error:', error);
      Alert.alert('Medication error', 'We could not load your medications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  const toggleMedication = async (medication: Medication) => {
    const nextTaken = !medication.taken;

    setMedications((current) =>
      current.map((item) =>
        item.id === medication.id
          ? {
              ...item,
              taken: nextTaken,
            }
          : item
      )
    );

    const { error } = await supabase
      .from('medications')
      .update({
        taken: nextTaken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', medication.id);

    if (error) {
      console.log('Medication update error:', error);
      Alert.alert('Update failed', 'We could not update this medication.');

      setMedications((current) =>
        current.map((item) =>
          item.id === medication.id
            ? {
                ...item,
                taken: medication.taken,
              }
            : item
        )
      );
    }
  };

  const takenCount = medications.filter((item) => item.taken).length;
  const totalCount = medications.length || 4;

  return (
    <Screen bottomSpace={40}>
      <Header title="Medication & Supplements" back />

      <Text style={styles.title}>Medication &{`\n`}Supplements</Text>
      <Text style={styles.sub}>Keep track of your daily wellness routine.</Text>

      <View style={styles.progress}>
        <View>
          <Text style={styles.label}>DAILY PROGRESS</Text>
          <Text style={styles.big}>
            {loading ? '...' : takenCount}{' '}
            <Text style={styles.small}>of {totalCount} taken</Text>
          </Text>
        </View>

        <View style={styles.ring}>
          <Ionicons name="checkmark-circle" size={34} color="#765B60" />
        </View>
      </View>

      <View style={styles.headingRow}>
        <Text style={styles.heading}>Upcoming Doses</Text>
        <Text style={styles.link}>Live Routine</Text>
      </View>

      <View style={styles.doses}>
        <View style={styles.dose}>
          <Text style={styles.time}>12:30 PM</Text>
          <Text style={styles.doseTitle}>Iron Supplement</Text>
          <Text style={styles.doseSub}>💊 1 Tablet</Text>
        </View>

        <View style={[styles.dose, { backgroundColor: '#FFF4EB' }]}>
          <Text style={styles.time}>8:00 PM</Text>
          <Text style={styles.doseTitle}>Calcium</Text>
          <Text style={styles.doseSub}>⊞ 2 Softgels</Text>
        </View>
      </View>

      <Text style={styles.heading}>Your Regimen</Text>

      {medications.map((item) => (
        <AnimatedPressable
          key={item.id}
          onPress={() => toggleMedication(item)}
          style={styles.regimen}
        >
          <View style={styles.medIcon}>
            <Ionicons name="medical-outline" size={22} color="#765B60" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.doseTitle}>{item.name}</Text>
            <Text style={styles.doseSub}>
              {item.dosage || 'Dose not set'} • {item.schedule || 'Schedule not set'}
              {item.time_label ? ` at ${item.time_label}` : ''}
            </Text>
          </View>

          <View style={[styles.check, item.taken && styles.checkOn]}>
            <Ionicons name="checkmark" size={24} color={item.taken ? '#fff' : '#765B60'} />
          </View>
        </AnimatedPressable>
      ))}

      <View style={styles.tip}>
        <Ionicons name="bulb-outline" size={24} color="#765B60" />

        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Tip for today</Text>
          <Text style={styles.tipCopy}>
            Taking your iron supplement with a glass of orange juice can help improve absorption.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.title,
    fontSize: 31,
    color: '#201A1A',
    marginTop: 20,
  },
  sub: {
    ...type.body,
    color: '#51484A',
    marginTop: 5,
  },
  progress: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 24,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...type.section,
    color: '#755F64',
  },
  big: {
    ...type.hero,
    fontSize: 44,
    color: '#765B60',
    marginTop: 4,
  },
  small: {
    ...type.body,
    fontSize: 18,
  },
  ring: {
    width: 92,
    height: 72,
    borderRadius: 46,
    borderWidth: 10,
    borderColor: '#765B60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  heading: {
    ...type.body,
    fontSize: 21,
    color: '#2D2525',
    marginTop: 24,
    marginBottom: 12,
  },
  link: {
    ...type.body,
    color: '#58494C',
    marginTop: 24,
  },
  doses: {
    flexDirection: 'row',
    gap: 14,
  },
  dose: {
    flex: 1,
    backgroundColor: '#F0EEFF',
    borderRadius: 18,
    padding: 18,
  },
  time: {
    ...type.body,
    color: '#6A677D',
  },
  doseTitle: {
    ...type.bodyStrong,
    color: '#2B2425',
    marginTop: 6,
  },
  doseSub: {
    ...type.small,
    color: '#665B5D',
    marginTop: 2,
  },
  regimen: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.softSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 48,
    height: 38,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D8C8CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: '#765B60',
    borderColor: '#765B60',
  },
  tip: {
    backgroundColor: '#FFF0E7',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  tipTitle: {
    ...type.body,
    fontSize: 19,
    color: '#5A474B',
  },
  tipCopy: {
    ...type.body,
    color: '#5A474B',
    marginTop: 3,
  },
});
