import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { CalendarIcon, GrowthIcon, HeartIcon } from '@/components/ui/icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

export default function DueDateResultScreen() {
  return (
    <Screen>
      <Header title="Preggers" back />
      <Text style={styles.eyebrow}>THE BIG DAY</Text>
      <Text style={styles.title}>Your estimated due date is</Text>
      <Card style={styles.dateCard}><Text style={styles.date}>March 18, 2027</Text><Text style={styles.trimester}>Trimester 1</Text><Text style={styles.copy}>You are 12 weeks, 4 days pregnant</Text></Card>
      <Card style={styles.cardRow}><View style={styles.icon}><GrowthIcon color={colors.plum} /></View><View style={{ flex: 1 }}><Text style={styles.section}>GROWTH MILESTONE</Text><Text style={styles.strong}>Baby is the size of a lime</Text><Text style={styles.copy}>Approximately 5.4 cm long</Text></View></Card>
      <Card style={styles.journey}><Text style={styles.section}>YOUR JOURNEY</Text><View style={styles.progressBar}><View style={styles.progressFill} /></View><View style={styles.split}><Text style={styles.percent}>31%</Text><Text style={styles.copy}>193 days remaining</Text></View></Card>
      <Text style={styles.heading}>Next Steps</Text>
      <Card style={styles.step}><CalendarIcon color={colors.plum}/><View style={{flex:1}}><Text style={styles.strong}>12-Week Ultrasound</Text><Text style={styles.copy}>Schedule your Nuchal Scan</Text></View></Card>
      <Card style={styles.step}><HeartIcon color={colors.plum}/><View style={{flex:1}}><Text style={styles.strong}>Prenatal Vitamins</Text><Text style={styles.copy}>Don’t forget your morning dose</Text></View></Card>
      <Button label="Back to Calculator" variant="secondary" onPress={() => router.back()} style={{ marginTop: 18 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...type.section, color: colors.rose, marginTop: 28, textAlign: 'center' },
  title: { ...type.title, color: colors.ink, marginTop: 8, textAlign: 'center' },
  dateCard: { alignItems: 'center', marginTop: 22, paddingVertical: 26 },
  date: { ...type.hero, color: colors.plum, textAlign: 'center' },
  trimester: { ...type.bodyStrong, color: colors.rose, marginTop: 12 },
  copy: { ...type.small, color: colors.text },
  cardRow: { marginTop: 18, flexDirection: 'row', gap: 14, alignItems: 'center' },
  icon: { width: 54, height: 54, borderRadius: 20, backgroundColor: colors.softSurface, alignItems: 'center', justifyContent: 'center' },
  section: { ...type.section, color: colors.rose, marginBottom: 6 },
  strong: { ...type.bodyStrong, color: colors.ink },
  journey: { marginTop: 18 },
  progressBar: { height: 12, borderRadius: 99, backgroundColor: colors.softSurface, overflow: 'hidden', marginTop: 12 },
  progressFill: { width: '31%', backgroundColor: colors.plum, height: '100%' },
  split: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  percent: { ...type.bodyStrong, color: colors.plum },
  heading: { ...type.bodyStrong, color: colors.ink, marginTop: 24, marginBottom: 12 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 }
});
