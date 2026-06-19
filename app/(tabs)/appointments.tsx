import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { CalendarIcon, PinIcon, PlusIcon } from '@/components/ui/icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { reminders } from '@/data/mockData';

export default function AppointmentsScreen() {
  return (
    <Screen>
      <Header />
      <Text style={styles.title}>Appointments</Text>
      <AnimatedPressable onPress={() => router.push('/appointment/details')}>
        <Card>
          <View style={styles.headerRow}><Text style={styles.section}>Appointments</Text><Text style={styles.viewAll}>View All</Text></View>
          <View style={styles.row}><View style={styles.icon}><CalendarIcon color={colors.plum} /></View><View style={{ flex: 1 }}><Text style={styles.name}>Anatomy scan</Text><Text style={styles.copy}>July 22, 10:30 AM</Text></View><Text style={styles.badge}>Confirmed</Text></View>
          <Text style={styles.info}>Dr. Sarah Jenkins</Text><View style={styles.location}><PinIcon size={18} /><Text style={styles.info}>Riverside Women’s Health Clinic</Text></View><Button label="Get Directions" variant="secondary" style={{ marginTop: 16 }} />
        </Card>
      </AnimatedPressable>
      <Card style={styles.reminderCard}>
        <Text style={styles.heading}>Daily Reminders</Text>
        {reminders.map(item => <View key={item.title} style={styles.reminder}><Text style={styles.reminderTitle}>{item.title}</Text><Text style={styles.reminderTime}>{item.time}</Text></View>)}
      </Card>
      <Card style={styles.calendarCard}>
        <Text style={styles.section}>UPCOMING MILESTONES</Text>
        <View style={styles.days}>{['Mon\n22','Tue\n23','Wed\n24','Thu\n25','Fri\n26'].map(day => <View key={day} style={day.includes('25') ? styles.dayActive : styles.day}><Text style={day.includes('25') ? styles.dayActiveText : styles.dayText}>{day}</Text></View>)}</View>
      </Card>
      <AnimatedPressable style={styles.fab}><PlusIcon /></AnimatedPressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { ...type.title, color: colors.ink, marginTop: 20, marginBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  section: { ...type.section, color: colors.rose },
  viewAll: { ...type.small, color: colors.plum },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 20, backgroundColor: colors.softSurface, alignItems: 'center', justifyContent: 'center' },
  name: { ...type.bodyStrong, color: colors.ink },
  copy: { ...type.small, color: colors.text },
  badge: { ...type.tiny, color: colors.green, backgroundColor: '#EFF5EA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  info: { ...type.small, color: colors.text, marginTop: 10 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderCard: { marginTop: 18 },
  heading: { ...type.bodyStrong, color: colors.ink, marginBottom: 8 },
  reminder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  reminderTitle: { ...type.bodyStrong, color: colors.ink },
  reminderTime: { ...type.small, color: colors.plum, textAlign: 'right' },
  calendarCard: { marginTop: 18 },
  days: { flexDirection: 'row', gap: 8, marginTop: 14 },
  day: { flex: 1, minHeight: 58, borderRadius: 18, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  dayActive: { flex: 1, minHeight: 58, borderRadius: 18, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  dayText: { ...type.tiny, color: colors.text, textAlign: 'center' },
  dayActiveText: { ...type.tiny, color: colors.surface, textAlign: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 108, width: 58, height: 58, borderRadius: 22, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' }
});
