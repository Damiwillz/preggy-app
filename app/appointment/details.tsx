import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { CalendarIcon, PinIcon } from '@/components/ui/icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { appointment } from '@/data/mockData';

export default function AppointmentDetailsScreen() {
  return (
    <Screen>
      <Header title="Appointment" back />
      <Card style={styles.hero}>
        <Text style={styles.badge}>{appointment.status}</Text>
        <Text style={styles.title}>{appointment.detailTitle}</Text>
        <View style={styles.infoRow}><CalendarIcon color={colors.plum} /><Text style={styles.copy}>{appointment.date}</Text></View>
        <Text style={styles.doctor}>{appointment.doctor}</Text>
        <View style={styles.infoRow}><PinIcon color={colors.plum} /><Text style={styles.copy}>{appointment.clinic}</Text></View>
        <Button label="Get Directions" variant="secondary" style={{ marginTop: 18 }} />
      </Card>
      <Text style={styles.heading}>Preparation Checklist</Text>
      {['Drink 32oz of water 1 hour before','Bring insurance card','Wear comfortable clothing'].map(item => <Card key={item} style={styles.check}><View style={styles.checkDot} /><Text style={styles.checkText}>{item}</Text></Card>)}
      <View style={styles.sectionRow}><Text style={styles.heading}>Notes & Questions</Text><Text style={styles.add}>Add New</Text></View>
      {['Ask about prenatal vitamin adjustments.','Can I continue my yoga routine?','When should we schedule the next screening?'].map(item => <Card key={item} style={styles.note}><Text style={styles.copy}>{item}</Text></Card>)}
      <Button label="Reschedule Appointment" variant="secondary" style={{ marginTop: 18 }} />
      <Button label="Cancel Appointment" variant="ghost" onPress={() => router.push('/appointment/cancel')} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { marginTop: 24 },
  badge: { ...type.section, color: colors.rose, marginBottom: 12 },
  title: { ...type.title, color: colors.ink, marginBottom: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  copy: { ...type.body, color: colors.text },
  doctor: { ...type.bodyStrong, color: colors.ink, marginTop: 18 },
  heading: { ...type.bodyStrong, color: colors.ink, marginTop: 24, marginBottom: 12 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, paddingVertical: 16 },
  checkDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 6, borderColor: colors.plum, backgroundColor: colors.surface },
  checkText: { ...type.bodyStrong, color: colors.ink, flex: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  add: { ...type.small, color: colors.plum, marginTop: 16 },
  note: { marginBottom: 10, backgroundColor: colors.cream }
});
