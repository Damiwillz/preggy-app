import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';

type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  taken: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function displayFrequency(medication: Medication) {
  return medication.frequency || 'Daily';
}

function displayDosage(medication: Medication) {
  return medication.dosage || 'As directed';
}

export default function MedicationScreen() {
  const { palette } = useAppTheme();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function getUserId() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    const userId = data.user?.id;

    if (!userId) {
      throw new Error('No logged in user.');
    }

    return userId;
  }

  async function loadMedications() {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    setMedications((data ?? []) as Medication[]);
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);

      loadMedications()
        .catch((error) => {
          console.log('Medication load error:', error);
          Alert.alert('Medication', 'Could not load medications.');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  async function addMedication() {
    Alert.alert(
      'Add medication',
      'A full medication form is coming soon. For now, your saved medications and supplements will appear here once added.'
    );
  }

  async function deleteMedication(medication: Medication) {
    Alert.alert(
      'Delete medication',
      `Remove ${medication.name} from your routine?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSavingId(medication.id);

            const previous = medications;

            setMedications((old) => old.filter((item) => item.id !== medication.id));

            try {
              const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', medication.id);

              if (error) throw error;
            } catch (error) {
              console.log('Delete medication error:', error);

              setMedications(previous);
              Alert.alert('Medication', 'Could not delete medication.');
            } finally {
              setSavingId(null);
            }
          },
        },
      ]
    );
  }

  async function toggleMedication(medication: Medication) {
    setSavingId(medication.id);

    const previous = medications;
    const nextTaken = !medication.taken;

    setMedications((old) =>
      old.map((item) =>
        item.id === medication.id
          ? {
              ...item,
              taken: nextTaken,
            }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('medications')
        .update({
          taken: nextTaken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', medication.id);

      if (error) throw error;
    } catch (error) {
      console.log('Toggle medication error:', error);

      setMedications(previous);
      Alert.alert('Medication', 'Could not update medication.');
    } finally {
      setSavingId(null);
    }
  }

  const total = medications.length;
  const taken = medications.filter((item) => item.taken).length;
  const progress = total > 0 ? Math.round((taken / total) * 100) : 0;

  return (
    <Screen bottomSpace={120}>
      <Header title="Medication" back />

      <View style={styles.heading}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>DAILY ROUTINE</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Medication & Supplements</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Track your prenatal vitamins, supplements, and care routines.
          </Text>
        </View>

        <AnimatedPressable
          onPress={addMedication}
          disabled={adding}
          style={[styles.addButton, { backgroundColor: palette.accent }]}
        >
          {adding ? (
            <ActivityIndicator color={palette.onAccent} />
          ) : (
            <Ionicons name="add" size={26} color={palette.onAccent} />
          )}
        </AnimatedPressable>
      </View>

      <View style={[styles.summary, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <View>
          <Text style={[styles.summaryLabel, { color: palette.accent }]}>TODAY’S PROGRESS</Text>
          <Text style={[styles.summaryTitle, { color: palette.ink }]}>
            {taken}/{total} completed
          </Text>
        </View>

        <View style={[styles.progressCircle, { backgroundColor: palette.surface }]}>
          <Text style={[styles.progressText, { color: palette.accent }]}>{progress}%</Text>
        </View>
      </View>

      {loading ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Loading routine...</Text>
        </View>
      ) : medications.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="medkit-outline" size={34} color={palette.accent} />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No medications yet</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Tap the plus button to add your vitamins, supplements, or medication reminders.
          </Text>
        </View>
      ) : (
        medications.map((medication) => {
          const isTaken = !!medication.taken;

          return (
            <AnimatedPressable
              key={medication.id}
              onPress={() => toggleMedication(medication)}
              disabled={savingId === medication.id}
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: isTaken ? palette.success : palette.line,
                },
              ]}
            >
              <View style={[styles.medIcon, { backgroundColor: isTaken ? palette.success + '22' : palette.accentSoft }]}>
                {savingId === medication.id ? (
                  <ActivityIndicator color={palette.accent} />
                ) : (
                  <Ionicons
                    name={isTaken ? 'checkmark-circle' : 'ellipse-outline'}
                    size={30}
                    color={isTaken ? palette.success : palette.accent}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.medTitle, { color: palette.ink }]}>{medication.name}</Text>

                <Text style={[styles.medMeta, { color: palette.text }]}>
                  {displayDosage(medication)} • {displayFrequency(medication)}
                </Text>

                {medication.instructions ? (
                  <Text style={[styles.instructions, { color: palette.muted }]}>{medication.instructions}</Text>
                ) : null}
              </View>

              <View style={styles.rightActions}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isTaken ? palette.success + '22' : palette.softSurface },
                  ]}
                >
                  <Text style={[styles.statusText, { color: isTaken ? palette.success : palette.text }]}>
                    {isTaken ? 'Taken' : 'Due'}
                  </Text>
                </View>

                <AnimatedPressable
                  onPress={() => deleteMedication(medication)}
                  disabled={savingId === medication.id}
                  style={[styles.deleteButton, { backgroundColor: palette.danger + '20' }]}
                >
                  <Ionicons name="trash-outline" size={18} color={palette.danger} />
                </AnimatedPressable>
              </View>
            </AnimatedPressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginTop: 22,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 30,
    lineHeight: 36,
    marginTop: 3,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 7,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  summary: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...type.section,
  },
  summaryTitle: {
    ...type.title,
    fontSize: 26,
    marginTop: 4,
  },
  progressCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  empty: {
    minHeight: 240,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyCopy: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  medIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTitle: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  medMeta: {
    ...type.small,
    marginTop: 4,
  },
  instructions: {
    ...type.small,
    marginTop: 5,
    lineHeight: 18,
  },
  rightActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...type.tiny,
    fontWeight: '900',
  },
});
