import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

export default function CancelAppointmentScreen() {
  return (
    <Screen>
      <Header title="Appointment" back />
      <Text style={styles.title}>Cancel your appointment?</Text>
      <Text style={styles.intro}>We understand things change. Let us know why so we can better support your journey.</Text>
      <Card style={styles.appt}><Text style={styles.name}>Anatomy Scan</Text><Text style={styles.copy}>Dr. Sarah Jenkins</Text><Text style={styles.copy}>Oct 25, 2023 • 10:30 AM</Text></Card>
      <Text style={styles.section}>REASON FOR CANCELLATION</Text>
      {['Scheduling conflict','Feeling unwell','Changed provider','Other'].map((item, index) => <Card key={item} style={styles.reason}><View style={[styles.radio, index === 0 && styles.radioActive]} /><Text style={styles.reasonText}>{item}</Text></Card>)}
      <Card style={styles.support}><Text style={styles.supportTitle}>Need a different time?</Text><Text style={styles.copy}>Maintaining regular checkups is vital for your baby’s development.</Text><Button label="Reschedule instead" variant="secondary" style={{ marginTop: 16 }} /></Card>
      <Button label="Keep Appointment" onPress={() => router.back()} style={{ marginTop: 18 }} />
      <Button label="Confirm Cancellation" variant="danger" style={{ marginTop: 12 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { ...type.hero, color: colors.ink, marginTop: 30 },
  intro: { ...type.body, color: colors.text, marginTop: 12, marginBottom: 20 },
  appt: { backgroundColor: colors.softSurface },
  name: { ...type.bodyStrong, color: colors.ink, marginBottom: 8 },
  copy: { ...type.small, color: colors.text },
  section: { ...type.section, color: colors.rose, marginTop: 24, marginBottom: 12 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, paddingVertical: 16 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line },
  radioActive: { borderWidth: 7, borderColor: colors.plum },
  reasonText: { ...type.bodyStrong, color: colors.ink },
  support: { marginTop: 10 },
  supportTitle: { ...type.bodyStrong, color: colors.ink, marginBottom: 6 }
});
