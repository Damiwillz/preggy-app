import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const C = {
  bg: '#FFF9F6',
  ink: '#171214',
  body: '#5E5052',
  plum: '#765A61',
  blush: '#FFD9D3',
  dot: '#D8CCCA',
};

export default function OnboardingJourney() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <Image
        source={require('../../assets/images/onboarding-journey-clean.jpg')}
        style={styles.hero}
        resizeMode="cover"
      />

      <LinearGradient
        colors={[
          'rgba(255,249,246,0)',
          'rgba(255,249,246,.20)',
          'rgba(255,249,246,.88)',
          C.bg,
        ]}
        locations={[0, 0.42, 0.67, 0.81]}
        style={styles.fade}
      />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.spacer} />

          <Text style={styles.brand}>Preggers</Text>
          <Text style={styles.title}>Track your pregnancy journey{`\n`}with love</Text>
          <Text style={styles.copy}>
            Calculate your due date, follow your baby’s growth, and feel prepared every week.
          </Text>

          <Pressable
            onPress={() => router.push('/onboarding/track-milestones')}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>Get Started</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/auth/log-in')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>I already have an account</Text>
          </Pressable>

          <View style={styles.dots}>
            <View style={styles.activeDot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  hero: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '72%',
  },
  fade: {
    ...StyleSheet.absoluteFillObject,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 18,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  brand: {
    fontFamily: 'Avenir Next',
    fontWeight: '800',
    fontSize: 30,
    color: C.plum,
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Avenir Next',
    fontWeight: '800',
    fontSize: 29,
    lineHeight: 35,
    textAlign: 'center',
    color: C.ink,
    letterSpacing: -0.7,
  },
  copy: {
    fontFamily: 'Avenir Next',
    fontWeight: '500',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    color: C.body,
    marginTop: 16,
    maxWidth: 355,
  },
  primary: {
    width: '100%',
    height: 62,
    borderRadius: 31,
    backgroundColor: C.blush,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: '#75585B',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  primaryText: {
    fontFamily: 'Avenir Next',
    fontWeight: '700',
    fontSize: 18,
    color: '#5D474B',
  },
  linkButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  linkText: {
    fontFamily: 'Avenir Next',
    fontWeight: '700',
    fontSize: 16,
    color: '#3C3444',
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginTop: 4,
  },
  activeDot: {
    width: 34,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.plum,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.dot,
  },
});
