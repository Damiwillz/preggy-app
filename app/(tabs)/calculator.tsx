import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

export default function CalculatorScreen() {
  return (
    <Screen>
      <Header title="Calculator" />
      <Text style={styles.eyebrow}>PLANNING AHEAD</Text>
      <Text style={styles.title}>Find your magic date</Text>
      <Text style={styles.intro}>Fill in your details below to estimate your pregnancy timeline. All dates are calculated based on standard medical formulas.</Text>
      <Card style={styles.form}>
        <TextField label="First day of last period" helper="The start of your last menstrual cycle" placeholder="mm/dd/yyyy" />
        <TextField label="Average cycle length" helper="Usually between 21 and 35 days" placeholder="28 days" />
        <TextField label="Conception date" placeholder="mm/dd/yyyy" />
        <TextField label="IVF transfer date" placeholder="mm/dd/yyyy" />
        <Button label="Calculate Due Date" onPress={() => router.push('/calculator/result')} style={{ marginTop: 6 }} />
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...type.section, color: colors.rose, marginTop: 28 },
  title: { ...type.hero, color: colors.ink, marginTop: 6 },
  intro: { ...type.body, color: colors.text, marginTop: 12, marginBottom: 22 },
  form: { paddingTop: 22 }
});
