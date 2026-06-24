import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { requestAccountDeletion } from '@/services/accountDeletion';
import { signOut } from '@/services/auth';

export default function DeleteAccountScreen() {
  const [submitting, setSubmitting] = useState(false);

  async function submitDeletionRequest() {
    setSubmitting(true);

    try {
      await requestAccountDeletion();

      Alert.alert(
        'Request sent',
        'Your account deletion request has been submitted. You will now be signed out.',
        [
          {
            text: 'OK',
            onPress: () => {
              void signOut().then(() => router.replace('/auth/login' as never));
            },
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';

      Alert.alert('Could not send request', message);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDeletionRequest() {
    Alert.alert(
      'Request account deletion?',
      'This will submit a permanent account deletion request for your Preggy account and saved pregnancy data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Request deletion',
          style: 'destructive',
          onPress: submitDeletionRequest,
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#2A151B" />
          <Text style={styles.backText}>Data Privacy</Text>
        </Pressable>

        <View style={styles.iconWrap}>
          <Ionicons name="person-remove-outline" size={34} color="#C92E3F" />
        </View>

        <Text style={styles.title}>Delete My Account</Text>

        <Text style={styles.copy}>
          You can request permanent deletion of your Preggy account and associated app data.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data included in the request</Text>

          <Text style={styles.item}>• Profile and account details</Text>
          <Text style={styles.item}>• Pregnancy profile information</Text>
          <Text style={styles.item}>• Symptom logs</Text>
          <Text style={styles.item}>• Appointments</Text>
          <Text style={styles.item}>• Medication and supplement records</Text>
          <Text style={styles.item}>• Privacy settings</Text>
          <Text style={styles.item}>• Avatar and AI chat history, where applicable</Text>
        </View>

        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={22} color="#8B3A2E" />
          <Text style={styles.warningText}>
            This action is not instant. Your request will be reviewed and processed. You may be contacted to confirm account ownership.
          </Text>
        </View>

        <Pressable
          style={[styles.deleteButton, submitting && styles.disabled]}
          onPress={confirmDeletionRequest}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={submitting}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  container: {
    padding: 22,
    paddingBottom: 44,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A151B',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFE7EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 31,
    fontWeight: '900',
    color: '#2A151B',
    letterSpacing: -0.8,
  },
  copy: {
    fontSize: 16,
    lineHeight: 24,
    color: '#725B61',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 22,
    shadowColor: '#2A151B',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2A151B',
    marginBottom: 12,
  },
  item: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5C4B50',
  },
  warning: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF0E8',
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#8B3A2E',
    fontWeight: '700',
  },
  deleteButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#C92E3F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  disabled: {
    opacity: 0.65,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  cancelButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#725B61',
    fontSize: 16,
    fontWeight: '800',
  },
});
