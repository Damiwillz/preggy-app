import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingOne() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Image
        source={require('../../assets/images/onboarding-screen-1.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Get Started"
        onPress={() => router.push('/onboarding/track-milestones')}
        style={styles.primary}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="I already have an account"
        onPress={() => router.replace('/auth/log-in')}
        style={styles.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  primary: { position: 'absolute', left: '6%', right: '6%', top: '75.2%', height: '8.2%', borderRadius: 40 },
  secondary: { position: 'absolute', left: '10%', right: '10%', top: '84.4%', height: '5.8%' },
});
