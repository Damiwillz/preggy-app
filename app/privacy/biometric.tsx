import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

const Benefit = ({ icon, title, copy }: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string }) => (
  <View style={styles.benefit}>
    <View style={styles.benefitIcon}><Ionicons name={icon} size={24} color="#71585E" /></View>
    <View style={{ flex: 1 }}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitCopy}>{copy}</Text></View>
  </View>
);

export default function BiometricSetupScreen() {
  const [enabled, setEnabled] = useState(false);
  const enable = () => {
    setEnabled(true);
    Alert.alert('Biometric lock enabled', 'Preggers will ask for Face ID or Touch ID when you open private areas.', [
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  return (
    <Screen scroll={false} bottomSpace={24} style={styles.screen}>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={28} color="#35292C" /></AnimatedPressable>
        <Text style={styles.brand}>Preggers</Text>
        <View style={styles.device}><Ionicons name="scan-circle-outline" size={30} color="#17313B" /></View>
      </View>

      <LinearGradient colors={['#FFF6F7', '#F6EFF4', '#FFF9F6']} style={styles.hero}>
        <View style={[styles.float, styles.floatOne]}><Ionicons name="lock-closed-outline" size={25} color="#745B60" /></View>
        <View style={[styles.float, styles.floatTwo]}><Ionicons name="shield-checkmark-outline" size={23} color="#745B60" /></View>
        <View style={styles.fingerprintCard}>
          <Ionicons name="finger-print" size={102} color="#7A6268" />
          <View style={styles.dots}><View/><View/><View/></View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>{enabled ? 'Your Journey is Secure' : 'Secure Your Journey'}</Text>
        <Text style={styles.copy}>Add an extra layer of protection to your private health logs, ultrasound photos, and personal notes using your device’s biometrics.</Text>
        <View style={styles.benefits}>
          <Benefit icon="shield-checkmark-outline" title="Enhanced Privacy" copy="Only you can access your diary" />
          <Benefit icon="flash-outline" title="Quick Access" copy="Unlock in less than a second" />
        </View>
      </View>

      <View style={styles.actions}>
        <AnimatedPressable onPress={enable} style={styles.primary}>
          <Ionicons name="finger-print" size={22} color="#6B555B" />
          <Text style={styles.primaryText}>{enabled ? 'Biometric Lock Enabled' : 'Enable Biometric Lock'}</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => router.back()} style={styles.later}><Text style={styles.laterText}>Maybe Later</Text></AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 0, paddingTop: 0 },
  header: { height: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, justifyContent: 'center' },
  brand: { ...type.brand, color: '#5C464D', fontSize: 28 },
  device: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#F5F0EF', alignItems: 'center', justifyContent: 'center' },
  hero: { height: 330, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fingerprintCard: { width: 220, height: 190, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', shadowColor: '#A98E94', shadowOpacity: 0.14, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } },
  dots: { flexDirection: 'row', gap: 7, marginTop: -14 },
  float: { position: 'absolute', width: 58, height: 58, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B7077', shadowOpacity: 0.12, shadowRadius: 15 },
  floatOne: { right: 44, top: 34 }, floatTwo: { left: 40, bottom: 32 },
  content: { paddingHorizontal: 24, alignItems: 'center', marginTop: 24 },
  title: { ...type.title, fontSize: 30, color: '#241B1D', textAlign: 'center' },
  copy: { ...type.body, color: '#65585B', textAlign: 'center', lineHeight: 25, marginTop: 12, maxWidth: 360 },
  benefits: { width: '100%', gap: 12, marginTop: 28 },
  benefit: { minHeight: 74, borderRadius: 22, backgroundColor: '#F9F4F1', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 14 },
  benefitIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { ...type.bodyStrong, color: '#302628', fontSize: 17 },
  benefitCopy: { ...type.small, color: '#675A5D', marginTop: 2 },
  actions: { marginTop: 'auto', paddingHorizontal: 24, paddingBottom: 14, gap: 8 },
  primary: { height: 58, borderRadius: 29, backgroundColor: '#FBD9D3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#A97B75', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  primaryText: { ...type.bodyStrong, color: '#665156', fontSize: 17 },
  later: { height: 48, alignItems: 'center', justifyContent: 'center' },
  laterText: { ...type.body, color: '#493C3F', fontSize: 17 },
});
