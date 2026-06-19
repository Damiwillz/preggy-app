import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/cards/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

export default function CreateAccountScreen() {
  return (
    <Screen bottomSpace={40}>
      <Header title="Preggers" showAvatar={false} />
      <Text style={styles.title}>Join Our Sanctuary</Text>
      <Text style={styles.subtitle}>Start your journey with a community that nurtures your wellness and growth.</Text>
      <Card>
        <TextField label="Full Name" placeholder="E.g. Sarah Mitchell" />
        <TextField label="Email Address" placeholder="sarah@example.com" keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Password" placeholder="••••••••" secureTextEntry />
        <Button label="Create Account" onPress={() => router.replace('/(tabs)/home')} style={{ marginTop: 8 }} />
        <Text style={styles.divider}>or continue with</Text>
        <View style={styles.socialRow}><Button label="Google" variant="secondary" style={styles.social} /><Button label="Apple" variant="secondary" style={styles.social} /></View>
      </Card>
      <AnimatedPressable onPress={() => router.push('/auth/log-in')} style={styles.linkWrap}><Text style={styles.link}>Already have an account? <Text style={styles.strong}>Log in</Text></Text></AnimatedPressable>
      <Text style={styles.legal}>By creating an account, you agree to our Terms of Service and Privacy Policy.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { ...type.hero, color: colors.ink, marginTop: 34, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.text, textAlign: 'center', marginTop: 10, marginBottom: 24, paddingHorizontal: 10 },
  divider: { ...type.small, color: colors.muted, textAlign: 'center', marginVertical: 20 },
  socialRow: { flexDirection: 'row', gap: 12 },
  social: { flex: 1, minHeight: 52 },
  linkWrap: { alignItems: 'center', marginTop: 22 },
  link: { ...type.body, color: colors.text },
  strong: { color: colors.plum, fontWeight: '800' },
  legal: { ...type.tiny, color: colors.muted, textAlign: 'center', marginTop: 24, paddingHorizontal: 20 }
});
