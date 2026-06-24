import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

export default function EditMedicationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const medicationId = typeof params.id === 'string' ? params.id : null;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMedication() {
      if (!medicationId) return;

      try {
        const { data, error } = await supabase
          .from('medications')
          .select('*')
          .eq('id', medicationId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setName(data.name || '');
          setDosage(data.dosage || '');
          setFrequency(data.frequency || '');
          setInstructions(data.instructions || '');
        }
      } catch (error) {
        console.log('Load medication edit error:', error);
        Alert.alert('Medication', 'Could not load this medication.');
      }
    }

    void loadMedication();
  }, [medicationId]);

  async function saveMedication() {
    Keyboard.dismiss();

    if (!medicationId) {
      Alert.alert('Medication missing', 'Open this medication from your routine list.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Medication name required', 'Enter a vitamin, supplement, or medication name.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('medications')
        .update({
          name: name.trim(),
          dosage: dosage.trim() || null,
          frequency: frequency.trim() || 'Daily',
          instructions: instructions.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', medicationId);

      if (error) throw error;

      Alert.alert('Medication updated', 'Your medication has been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not update medication', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={36} style={styles.screen}>
      <Header title="Edit Medication" back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit-outline" size={34} color="#CE6F79" />
          </View>

          <Text style={styles.title}>Edit medication</Text>
          <Text style={styles.subtitle}>Update your vitamin, supplement, medication, or care routine.</Text>
        </View>

        <View style={styles.card}>
          <Field label="Name" placeholder="Prenatal vitamin" value={name} onChangeText={setName} />
          <Field label="Dosage" placeholder="1 tablet" value={dosage} onChangeText={setDosage} />
          <Field label="Frequency" placeholder="Daily" value={frequency} onChangeText={setFrequency} />
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
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Update Medication'}</Text>
          </AnimatedPressable>
        </View>
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    ...type.title,
    color: '#2A151B',
    fontSize: 30,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: '#9C7B82',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
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
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 16,
    color: '#2A151B',
    ...type.body,
  },
  textarea: {
    minHeight: 104,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
