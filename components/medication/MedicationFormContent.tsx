import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

type Props = {
  medicationId?: string | null;
};

const frequencyOptions = ['Daily', 'Morning', 'Night', 'Weekly'];

export function MedicationFormContent({ medicationId = null }: Props) {
  const isEditing = !!medicationId;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMedication() {
      if (!medicationId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('medications')
          .select('*')
          .eq('id', medicationId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setName(data.name || '');
          setDosage(data.dosage || '');
          setFrequency(data.frequency || 'Daily');
          setInstructions(data.instructions || '');
        }
      } catch (error) {
        console.log('Load medication form error:', error);
        Alert.alert('Medication', 'Could not load this medication.');
      } finally {
        setLoading(false);
      }
    }

    void loadMedication();
  }, [medicationId]);

  async function saveMedication() {
    Keyboard.dismiss();

    if (!name.trim()) {
      Alert.alert('Medication name required', 'Enter a vitamin, supplement, or medication name.');
      return;
    }

    setSaving(true);

    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = data.user?.id;

      if (!userId) throw new Error('No logged in user.');

      const payload = {
        user_id: userId,
        name: name.trim(),
        dosage: dosage.trim() || null,
        frequency: frequency.trim() || 'Daily',
        instructions: instructions.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const query =
        isEditing && medicationId
          ? supabase.from('medications').update(payload).eq('id', medicationId).eq('user_id', userId)
          : supabase.from('medications').insert({
              ...payload,
              taken: false,
            });

      const { error } = await query;

      if (error) throw error;

      Alert.alert(
        isEditing ? 'Medication updated' : 'Medication added',
        isEditing ? 'Your medication has been updated.' : 'Your medication or supplement has been saved.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert(isEditing ? 'Could not update medication' : 'Could not save medication', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={36} style={styles.screen}>
      <Header title={isEditing ? 'Edit Medication' : 'Add Medication'} back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit-outline" size={34} color="#fff" />
          </View>

          <Text style={styles.eyebrow}>DAILY ROUTINE</Text>
          <Text style={styles.title}>{isEditing ? 'Update your routine' : 'Add to your routine'}</Text>
          <Text style={styles.subtitle}>
            Track prenatal vitamins, supplements, prescriptions, and care instructions.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#CE6F79" />
            <Text style={styles.loadingText}>Loading medication...</Text>
          </View>
        ) : (
          <>
            <View style={styles.quickCard}>
              <View style={styles.quickIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.plum} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>Safety note</Text>
                <Text style={styles.quickCopy}>
                  Always follow your clinician’s medication advice, especially during pregnancy.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Field label="Name" placeholder="Prenatal vitamin" value={name} onChangeText={setName} />
              <Field label="Dosage" placeholder="1 tablet" value={dosage} onChangeText={setDosage} />

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyWrap}>
                {frequencyOptions.map((item) => {
                  const selected = frequency === item;

                  return (
                    <AnimatedPressable
                      key={item}
                      onPress={() => setFrequency(item)}
                      style={[styles.frequencyChip, selected && styles.frequencyChipActive]}
                    >
                      <Text style={[styles.frequencyText, selected && styles.frequencyTextActive]}>
                        {item}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <Field
                label="Custom frequency"
                placeholder="Every 12 hours, with breakfast..."
                value={frequencyOptions.includes(frequency) ? '' : frequency}
                onChangeText={(value) => setFrequency(value || 'Daily')}
              />

              <Field
                label="Instructions"
                placeholder="Take with food and water"
                value={instructions}
                onChangeText={setInstructions}
                multiline
              />

              <AnimatedPressable
                style={[styles.button, saving && styles.disabled]}
                onPress={saveMedication}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.buttonText}>
                      {isEditing ? 'Update medication' : 'Save medication'}
                    </Text>
                  </>
                )}
              </AnimatedPressable>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#A98C93"
        style={[styles.input, props.multiline && styles.textarea]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: '#CE6F79',
    borderRadius: 34,
    padding: 24,
    marginTop: 18,
    minHeight: 240,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    color: '#fff',
    fontSize: 32,
    lineHeight: 37,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    lineHeight: 23,
  },
  loadingCard: {
    minHeight: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...type.small,
    color: '#9C7B82',
  },
  quickCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    ...type.bodyStrong,
    color: '#2A151B',
  },
  quickCopy: {
    ...type.small,
    color: '#9C7B82',
    marginTop: 3,
    lineHeight: 20,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    ...type.small,
    color: '#2A151B',
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 16,
    color: '#2A151B',
    ...type.body,
  },
  textarea: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  frequencyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
  },
  frequencyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  frequencyChipActive: {
    backgroundColor: '#CE6F79',
    borderColor: '#CE6F79',
  },
  frequencyText: {
    ...type.small,
    color: '#2A151B',
    fontWeight: '900',
  },
  frequencyTextActive: {
    color: '#fff',
  },
  button: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexDirection: 'row',
    gap: 9,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
