import React, { useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

export default function AddMedicationScreen() {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

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

      const { error } = await supabase.from('medications').insert({
        user_id: userId,
        name: name.trim(),
        dosage: dosage.trim() || null,
        frequency: frequency.trim() || 'Daily',
        instructions: instructions.trim() || null,
        taken: false,
      });

      if (error) throw error;

      Alert.alert('Medication added', 'Your medication or supplement has been saved.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not save medication', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={36} style={styles.screen}>
      <Header title="Add Medication" back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit-outline" size={34} color="#CE6F79" />
          </View>

          <Text style={styles.title}>New medication</Text>
          <Text style={styles.subtitle}>Track vitamins, supplements, prescriptions, and care routines.</Text>
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
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Medication'}</Text>
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
