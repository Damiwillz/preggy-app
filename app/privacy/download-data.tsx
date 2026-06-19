import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';

type DataKey = 'Health & Symptom Logs' | 'Appointments & Notes' | 'Baby Growth Milestones' | 'Photos & Media';
const dataOptions: { label: DataKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Health & Symptom Logs', icon: 'document-text-outline' },
  { label: 'Appointments & Notes', icon: 'calendar-outline' },
  { label: 'Baby Growth Milestones', icon: 'happy-outline' },
  { label: 'Photos & Media', icon: 'images-outline' },
];

export default function DownloadDataScreen() {
  const [selected, setSelected] = useState<Record<DataKey, boolean>>({ 'Health & Symptom Logs': true, 'Appointments & Notes': true, 'Baby Growth Milestones': true, 'Photos & Media': true });
  const [format, setFormat] = useState<'JSON' | 'PDF'>('JSON');
  const [processing, setProcessing] = useState(false);
  const count = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
  const request = () => {
    if (!count) return Alert.alert('Select some data', 'Choose at least one data type to export.');
    setProcessing(true);
    setTimeout(() => { setProcessing(false); Alert.alert('Export requested', `Your ${format} export is being prepared. We’ll notify you when it is ready.`); }, 600);
  };
  return <Screen bottomSpace={110}>
    <Header title="Download My Data" back />
    <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="shield-checkmark-outline" size={37} color="#735A60" /></View><Text style={styles.heroText}>Your Data, Your Control</Text></View>
    <View style={styles.intro}><Text style={styles.introTitle}>Request a Download</Text><Text style={styles.introCopy}>Your privacy is our priority. You can request a file of your health logs, milestones, and shared moments. Once ready, it will be available for download for 30 days.</Text></View>

    <Text style={styles.section}>SELECT DATA TYPES</Text>
    <View style={{ gap: 10 }}>{dataOptions.map(({ label, icon }) => <AnimatedPressable key={label} onPress={() => setSelected(v => ({ ...v, [label]: !v[label] }))} style={styles.option}><View style={styles.optionIcon}><Ionicons name={icon} size={21} color="#705A62" /></View><Text style={styles.optionText}>{label}</Text><View style={[styles.check, selected[label] && styles.checkOn]}>{selected[label] && <Ionicons name="checkmark" size={18} color="#FFF" />}</View></AnimatedPressable>)}</View>

    <Text style={styles.section}>FORMAT OPTIONS</Text>
    <View style={styles.formats}>{(['JSON', 'PDF'] as const).map(f => <AnimatedPressable key={f} onPress={() => setFormat(f)} style={[styles.format, format === f && styles.formatActive]}><Ionicons name={f === 'JSON' ? 'code-slash-outline' : 'document-text-outline'} size={27} color="#675158"/><Text style={styles.formatTitle}>{f}</Text><Text style={styles.formatCopy}>{f === 'JSON' ? 'Data Portability' : 'Easy Printing'}</Text></AnimatedPressable>)}</View>
    <AnimatedPressable onPress={request} style={styles.export}><Ionicons name="download-outline" size={21} color="#FFF" /><Text style={styles.exportText}>{processing ? 'Preparing Export…' : 'Request Data Export'}</Text></AnimatedPressable>
    <Text style={styles.note}>Large exports may take up to 24 hours to process.</Text>

    <Text style={styles.section}>RECENT EXPORTS</Text>
    <View style={styles.recent}>
      <ExportRow icon="checkmark-circle-outline" title="Full Backup (PDF)" copy="Created: Oct 12 • 4.2 MB" action="Download" />
      <ExportRow icon="sync-outline" title="Media Only (JSON)" copy="Requested: Today, 2:15 PM" action="Processing" />
      <ExportRow icon="time-outline" title="Symptom Log (PDF)" copy="Expired: Sep 20" action="Expired" muted />
    </View>
  </Screen>;
}

const ExportRow = ({ icon, title, copy, action, muted }: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string; action: string; muted?: boolean }) => <View style={[styles.exportRow, muted && { opacity: 0.55 }]}><Ionicons name={icon} size={25} color={action === 'Download' ? '#2CB57A' : '#7A6A6E'} /><View style={{ flex: 1 }}><Text style={styles.exportTitle}>{title}</Text><Text style={styles.exportCopy}>{copy}</Text></View><Text style={[styles.action, action === 'Download' && styles.actionButton]}>{action}</Text></View>;

const styles = StyleSheet.create({
  hero: { marginTop: 14, minHeight: 120, backgroundColor: '#FFF1F2', borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, heroIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, heroText: { ...type.body, color: '#6F5B60', fontSize: 18, marginTop: 8 },
  intro: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 16 }, introTitle: { ...type.bodyStrong, color: '#392D30', fontSize: 18 }, introCopy: { ...type.body, color: '#65575A', lineHeight: 23, marginTop: 8 },
  section: { ...type.section, color: '#68565B', marginTop: 22, marginBottom: 9, letterSpacing: 2.5 },
  option: { minHeight: 58, backgroundColor: '#FFF', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 13 }, optionIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#F7F1FA', alignItems: 'center', justifyContent: 'center' }, optionText: { ...type.bodyStrong, color: '#2D2326', flex: 1 }, check: { width: 36, height: 28, borderRadius: 16, borderWidth: 1.5, borderColor: '#D9CBC8', alignItems: 'center', justifyContent: 'center' }, checkOn: { backgroundColor: '#745A61', borderColor: '#745A61' },
  formats: { flexDirection: 'row', gap: 12 }, format: { flex: 1, height: 94, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' }, formatActive: { backgroundColor: '#FFE5E8', borderColor: '#775B62' }, formatTitle: { ...type.bodyStrong, color: '#362A2D', marginTop: 3 }, formatCopy: { ...type.tiny, color: '#807275' },
  export: { height: 56, backgroundColor: '#755D64', borderRadius: 28, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, exportText: { ...type.bodyStrong, color: '#FFF', fontSize: 17 }, note: { ...type.small, color: '#726568', textAlign: 'center', marginTop: 8 },
  recent: { gap: 9 }, exportRow: { minHeight: 64, borderRadius: 18, backgroundColor: '#F8F3F1', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, exportTitle: { ...type.bodyStrong, color: '#2E2427' }, exportCopy: { ...type.tiny, color: '#776A6D' }, action: { ...type.small, color: '#74666A' }, actionButton: { backgroundColor: '#795D65', color: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 5 },
});
