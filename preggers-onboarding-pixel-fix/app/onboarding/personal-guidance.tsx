import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function PersonalGuidance() {
  const openLogin = () => router.replace('/auth/log-in');

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Image
        source={require('../../assets/images/onboarding-screen-3.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />

      <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={openLogin} style={styles.topSkip} />
      <Pressable accessibilityRole="button" accessibilityLabel="Get Started" onPress={openLogin} style={styles.primary} />
      <Pressable accessibilityRole="button" accessibilityLabel="I already have an account" onPress={openLogin} style={styles.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  topSkip: { position: 'absolute', right: '3%', top: '3%', width: '22%', height: '7%' },
  primary: { position: 'absolute', left: '6%', right: '6%', top: '84.3%', height: '7.3%', borderRadius: 40 },
  secondary: { position: 'absolute', left: '12%', right: '12%', top: '92.2%', height: '5.2%' },
});
