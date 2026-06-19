import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TrackMilestones() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Image
        source={require('../../assets/images/onboarding-screen-2.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next"
        onPress={() => router.push('/onboarding/personal-guidance')}
        style={styles.next}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
        onPress={() => router.replace('/auth/log-in')}
        style={styles.skip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  next: { position: 'absolute', left: '7%', right: '7%', top: '83.8%', height: '7.3%', borderRadius: 40 },
  skip: { position: 'absolute', left: '22%', right: '22%', top: '92%', height: '4.8%' },
});
