import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

type BagSection = { title: string; icon: keyof typeof Ionicons.glyphMap; tint: string; hero?: number; subtitle?: string; items: string[] };

const sections: BagSection[] = [
  { title: 'For Mom', icon: 'woman-outline', tint: '#FADCE2', items: ['Birth Plan', 'Comfortable Clothes', 'Toiletries', 'Nursing Bra', 'Phone Charger'] },
  { title: 'For Baby', icon: 'happy-outline', tint: '#E4E1FF', hero: require('../../assets/images/tips-bag-baby.jpg'), subtitle: 'Essential baby items for arrival', items: ['Car Seat (installed)', 'Going-home Outfit', 'Swaddle Blankets', 'Diapers & Wipes'] },
  { title: 'For Partner', icon: 'people-outline', tint: '#FFE7D7', items: ['Change of Clothes', 'Snacks', 'Camera', 'Pillow'] },
];

const initialChecked = ['Birth Plan', 'Comfortable Clothes', 'Car Seat (installed)', 'Diapers & Wipes', 'Camera'];

export default function HospitalBagScreen() {
  const [checked, setChecked] = useState<string[]>(initialChecked);
  const allItems = useMemo(() => sections.flatMap(section => section.items), []);
  const progress = Math.round((checked.length / allItems.length) * 100);

  const toggle = (item: string) => setChecked(current => current.includes(item) ? current.filter(x => x !== item) : [...current, item]);

  return (
    <Screen bottomSpace={44}>
      <Header title="Hospital Bag" back />
      <View style={styles.progressCard}>
        <View style={styles.progressTop}><View><Text style={styles.progressTitle}>Packing Progress</Text><Text style={styles.progressCopy}>{progress >= 100 ? 'Everything is ready!' : 'Almost ready for the big day!'}</Text></View><Text style={styles.progressValue}>{progress}%</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
        <Text style={styles.count}>{checked.length} of {allItems.length} essentials packed</Text>
      </View>

      {sections.map(section => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: section.tint }]}><Ionicons name={section.icon} size={22} color={colors.plum} /></View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {section.hero && (
            <View style={styles.hero}>
              <Image source={section.hero} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <View style={styles.heroShade} />
              <Text style={styles.heroText}>{section.subtitle}</Text>
            </View>
          )}
          <View style={styles.list}>
            {section.items.map((item, index) => {
              const isChecked = checked.includes(item);
              return (
                <AnimatedPressable key={item} onPress={() => toggle(item)} style={[styles.item, index < section.items.length - 1 && styles.itemDivider]}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </View>
                  <Text style={[styles.itemText, isChecked && styles.itemTextChecked]}>{item}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      ))}

      <AnimatedPressable onPress={() => setChecked(allItems)} style={styles.completeButton}>
        <Ionicons name="checkmark-done" size={21} color="#fff" />
        <Text style={styles.completeText}>Mark everything packed</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: { marginTop: 14, backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.line },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  progressTitle: { ...type.title, fontSize: 24, color: colors.ink },
  progressCopy: { ...type.small, color: colors.text, marginTop: 2 },
  progressValue: { ...type.title, fontSize: 30, color: colors.plum },
  track: { height: 9, borderRadius: 5, backgroundColor: '#F3E8E5', marginTop: 18, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: '#E7AAB8' },
  count: { ...type.tiny, color: colors.muted, marginTop: 8 },
  section: { marginTop: 24 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  sectionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...type.title, fontSize: 25, color: colors.ink },
  hero: { height: 130, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 10 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(33,23,19,.25)' },
  heroText: { ...type.bodyStrong, color: '#fff', padding: 16 },
  list: { backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  item: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  checkbox: { width: 30, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#796064', borderColor: '#796064' },
  itemText: { ...type.body, color: colors.ink },
  itemTextChecked: { color: colors.text },
  completeButton: { marginTop: 24, height: 56, borderRadius: 20, backgroundColor: colors.plum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  completeText: { ...type.bodyStrong, color: '#fff' },
});
