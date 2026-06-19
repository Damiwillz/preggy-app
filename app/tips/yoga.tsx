import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

const benefits = [
  ['leaf-outline', 'Stress Reduction', 'Lower cortisol levels through deep breathing and focused mindfulness.'],
  ['body-outline', 'Pelvic Strength', 'Specific poses help tone the pelvic floor for comfort and labor.'],
  ['accessibility-outline', 'Improved Flexibility', 'Gently open hips and the lower back as your belly grows.'],
] as const;

const sequence = [
  [require('../../assets/images/tips-yoga-catcow.jpg'), '1. Cat-Cow Stretch', 'Gently move between arching and rounding your back to wake up the spine.'],
  [require('../../assets/images/tips-yoga-childpose.jpg'), '2. Wide-Knee Child’s Pose', 'Create space for the belly while stretching the lower back and hips.'],
  [require('../../assets/images/tips-yoga-warrior.jpg'), '3. Modified Warrior II', 'Build leg strength and focus with a wider stance for balance.'],
] as const;

export default function YogaArticleScreen() {
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);

  return (
    <Screen bottomSpace={44}>
      <Header title="Preggers" back />
      <View style={styles.hero}>
        <Image source={require('../../assets/images/tips-yoga-hero.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(38,24,27,.65)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.heroMeta}><Text style={styles.heroMetaText}>WELLNESS • 8 MIN READ</Text></View>
      </View>

      <Text style={styles.title}>Gentle Yoga: Flowing with Pregnancy</Text>
      <Text style={styles.lead}>Embrace the changes of your body through mindful movement and breath. Yoga can become a quiet sanctuary for both you and your baby.</Text>

      <Text style={styles.sectionTitle}>Why Yoga?</Text>
      <View style={styles.card}>
        {benefits.map(([icon, title, copy], index) => (
          <View key={title} style={[styles.benefit, index < benefits.length - 1 && styles.divider]}>
            <View style={styles.iconBubble}><Ionicons name={icon} size={20} color={colors.plum} /></View>
            <View style={{ flex: 1 }}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.copy}>{copy}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.safety}>
        <View style={styles.safetyHeading}><Ionicons name="shield-checkmark-outline" size={24} color={colors.plum} /><Text style={styles.sectionTitleInline}>Safety First</Text></View>
        {[
          'Stay hydrated before, during and after your flow.',
          'Avoid deep twists or lying flat on your back after the first trimester.',
          'Listen to your body. Stop immediately if anything feels uncomfortable.',
        ].map(item => <View key={item} style={styles.bullet}><Ionicons name="checkmark-circle" size={18} color={colors.rose} /><Text style={styles.copy}>{item}</Text></View>)}
      </View>

      <Text style={styles.sectionTitle}>Morning Flow Sequence</Text>
      <View style={styles.sequenceList}>
        {sequence.map(([image, title, copy]) => (
          <View key={title} style={styles.sequenceRow}>
            <Image source={image} style={styles.sequenceImage} resizeMode="cover" />
            <View style={{ flex: 1 }}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.copy}>{copy}</Text></View>
          </View>
        ))}
      </View>

      <AnimatedPressable onPress={() => setStarted(v => !v)} style={[styles.session, started && styles.sessionActive]}>
        <View style={styles.play}><Ionicons name={started ? 'pause' : 'play'} size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}><Text style={styles.sessionTitle}>{started ? 'Session in progress' : 'Try a 10-minute Guided Session'}</Text><Text style={styles.sessionCopy}>Led by Sarah, Prenatal Specialist</Text></View>
        <Text style={styles.sessionTime}>{started ? '03:42' : '10:00'}</Text>
      </AnimatedPressable>

      <AnimatedPressable onPress={() => setSaved(v => !v)} style={[styles.save, saved && styles.saveActive]}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? '#fff' : colors.plum} />
        <Text style={[styles.saveText, saved && { color: '#fff' }]}>{saved ? 'Saved for Later' : 'Save for Later'}</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 240, borderRadius: 24, overflow: 'hidden', marginTop: 14, justifyContent: 'flex-end' },
  heroMeta: { alignSelf: 'flex-start', margin: 18, backgroundColor: '#FFF5F1', paddingHorizontal: 13, paddingVertical: 6, borderRadius: 14 },
  heroMetaText: { ...type.tiny, color: colors.plum },
  title: { ...type.title, color: colors.ink, marginTop: 20 },
  lead: { ...type.body, color: colors.text, marginTop: 8 },
  sectionTitle: { ...type.title, fontSize: 24, color: colors.ink, marginTop: 26, marginBottom: 12 },
  sectionTitleInline: { ...type.title, fontSize: 22, color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.line },
  benefit: { flexDirection: 'row', gap: 14, paddingVertical: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  iconBubble: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.softSurface, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { ...type.bodyStrong, color: colors.ink },
  copy: { ...type.small, color: colors.text, marginTop: 2, flex: 1 },
  safety: { marginTop: 22, padding: 20, borderRadius: 24, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#F0D4D6' },
  safetyHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  sequenceList: { gap: 14 },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: colors.line },
  sequenceImage: { width: 92, height: 72, borderRadius: 13 },
  session: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, backgroundColor: colors.plum },
  sessionActive: { backgroundColor: colors.rose },
  play: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' },
  sessionTitle: { ...type.bodyStrong, color: '#fff' },
  sessionCopy: { ...type.small, color: '#F4E8EE' },
  sessionTime: { ...type.small, color: '#fff' },
  save: { marginTop: 14, height: 54, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#F8DDE0' },
  saveActive: { backgroundColor: colors.plum },
  saveText: { ...type.bodyStrong, color: colors.plum },
});
