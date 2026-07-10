import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type EmergencyContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:emergency-contacts';

const roles = ['Doctor', 'Hospital', 'Partner', 'Family', 'Other'] as const;

export default function EmergencyContactsScreen() {
  const { palette } = useAppTheme();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const importantCount = useMemo(
    () => contacts.filter((item) => item.role === 'Doctor' || item.role === 'Hospital').length,
    [contacts]
  );

  useEffect(() => {
    async function loadContacts() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setContacts(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Emergency contacts load error:', error);
      }
    }

    void loadContacts();
  }, []);

  async function saveContacts(next: EmergencyContact[]) {
    setContacts(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Emergency contacts save error:', error);
    }
  }

  async function addContact() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanNote = note.trim();

    if (!cleanName) {
      Alert.alert('Add contact', 'Enter a contact name.');
      return;
    }

    if (!cleanPhone) {
      Alert.alert('Add phone number', 'Enter a phone number for this contact.');
      return;
    }

    const next: EmergencyContact[] = [
      {
        id: String(Date.now()),
        name: cleanName,
        role,
        phone: cleanPhone,
        note: cleanNote,
        createdAt: Date.now(),
      },
      ...contacts,
    ];

    setName('');
    setRole('Doctor');
    setPhone('');
    setNote('');
    await saveContacts(next);
  }

  async function deleteContact(id: string) {
    const next = contacts.filter((item) => item.id !== id);
    await saveContacts(next);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete contact?', 'This emergency contact will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteContact(id) },
    ]);
  }

  function callContact(phoneNumber: string) {
    const clean = phoneNumber.replace(/[^\d+]/g, '');

    if (!clean) {
      Alert.alert('Phone number unavailable', 'This contact does not have a valid phone number.');
      return;
    }

    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Could not call', 'Your device could not open the phone app.');
    });
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>SAFETY</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Emergency Contacts</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Keep your care team and trusted people easy to reach.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="call-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>QUICK ACCESS</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {contacts.length} saved contacts
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              {importantCount} care contacts saved.
            </Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW CONTACT</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={palette.muted}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.chipLabel, { color: palette.text }]}>Role</Text>

          <View style={styles.roleRow}>
            {roles.map((item) => {
              const active = item === role;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setRole(item)}
                  style={[
                    styles.roleChip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.roleText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.noteInput,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <AnimatedPressable
            onPress={addContact}
            style={[styles.addButton, { backgroundColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save contact</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            In urgent situations, call your local emergency number first.
          </Text>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>SAVED CONTACTS</Text>

          {contacts.length ? (
            <View style={styles.contactList}>
              {contacts.map((item) => (
                <View
                  key={item.id}
                  style={[styles.contactItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <AnimatedPressable
                    onPress={() => callContact(item.phone)}
                    style={[styles.callButton, { backgroundColor: palette.accent }]}
                  >
                    <Ionicons name="call" size={20} color={palette.onAccent} />
                  </AnimatedPressable>

                  <View style={{ flex: 1 }}>
                    <View style={styles.contactTop}>
                      <Text style={[styles.contactName, { color: palette.ink }]}>{item.name}</Text>
                      <View style={[styles.roleBadge, { backgroundColor: palette.accentSoft }]}>
                        <Text style={[styles.roleBadgeText, { color: palette.accent }]}>{item.role}</Text>
                      </View>
                    </View>

                    <Text style={[styles.contactPhone, { color: palette.text }]}>{item.phone}</Text>

                    {item.note ? (
                      <Text style={[styles.contactNote, { color: palette.muted }]}>{item.note}</Text>
                    ) : null}
                  </View>

                  <AnimatedPressable onPress={() => confirmDelete(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={19} color={palette.danger} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No emergency contacts saved yet.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  formCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    ...type.section,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...type.bodyStrong,
    fontSize: 15,
  },
  chipLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    minHeight: 38,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    ...type.tiny,
    fontWeight: '900',
  },
  noteInput: {
    minHeight: 86,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    minHeight: 52,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  noteCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
  listCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  contactList: {
    gap: 10,
    marginTop: 14,
  },
  contactItem: {
    minHeight: 82,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  contactName: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  roleBadge: {
    minHeight: 25,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  roleBadgeText: {
    ...type.tiny,
    fontWeight: '900',
  },
  contactPhone: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
    fontWeight: '900',
  },
  contactNote: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: '800',
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    marginTop: 14,
    fontWeight: '800',
  },
});
