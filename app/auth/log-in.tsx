import React, { useState } from 'react';
import { Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { LOCAL_AUTH } from '@/constants/auth';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = () => {
    Keyboard.dismiss();
    if (username.trim() !== LOCAL_AUTH.username || password !== LOCAL_AUTH.password) {
      setError('Incorrect username or password.');
      return;
    }
    setError('');
    router.replace('/(tabs)/home');
  };

  return (
    <Screen bottomSpace={32} style={styles.screen}>
      <View style={styles.heroWrap}>
        <Image
          source={require('../../assets/images/login-hero-clean.jpg')}
          style={styles.hero}
          resizeMode="cover"
        />
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#6A5B5B" />
        </AnimatedPressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to continue your journey</Text>

        <TextField
          label="Username"
          placeholder="Damilare"
          autoCapitalize="none"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setError('');
          }}
        />

        <TextField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          secureTextEntry
          enablePasswordToggle
          error={error}
          onSubmitEditing={login}
        />

        <AnimatedPressable
          style={styles.forgotPassword}
          onPress={() => router.push('/auth/reset-password')}
          accessibilityRole="button"
          accessibilityLabel="Reset your password"
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </AnimatedPressable>

        <Button label="Log In" onPress={login} />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>OR CONTINUE WITH</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socials}>
          <AnimatedPressable style={styles.social}>
            <Ionicons name="logo-google" size={21} color="#1C1718" />
            <Text style={styles.socialText}>Google</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.social}>
            <Ionicons name="logo-apple" size={22} color="#1C1718" />
            <Text style={styles.socialText}>Apple</Text>
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          style={styles.createAccount}
          onPress={() => router.push('/auth/create-account')}
        >
          <Text style={styles.createAccountText}>
            Don’t have an account? <Text style={styles.createAccountStrong}>Create an Account</Text>
          </Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    backgroundColor: '#FFF9F6',
  },
  heroWrap: {
    height: 292,
    backgroundColor: '#F4C4BB',
    position: 'relative',
    overflow: 'hidden',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  back: {
    position: 'absolute',
    left: 22,
    top: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,.93)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D4245',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  card: {
    marginTop: -28,
    marginHorizontal: 22,
    width: 'auto',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
    shadowColor: '#603B3B',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    ...type.title,
    fontSize: 30,
    color: '#665456',
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: '#4F4647',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 18,
    paddingVertical: 8,
    paddingLeft: 18,
  },
  forgotPasswordText: {
    ...type.small,
    color: '#6E2F5A',
    fontWeight: '800',
  },
  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE4E0',
  },
  or: {
    ...type.tiny,
    color: '#7C7070',
    textAlign: 'center',
  },
  socials: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  social: {
    flex: 1,
    minWidth: 0,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#F7F3F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialText: {
    ...type.body,
    color: '#282222',
    fontWeight: '600',
  },
  createAccount: {
    minHeight: 52,
    marginTop: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountText: {
    ...type.small,
    color: '#65595B',
    textAlign: 'center',
    lineHeight: 21,
  },
  createAccountStrong: {
    fontWeight: '800',
    color: '#4B3E42',
  },
});
