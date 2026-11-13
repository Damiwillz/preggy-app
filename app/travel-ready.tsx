import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type TravelItem = {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  complete: boolean;
};

type TravelPlan = {
  destination: string;
  departure: string;
  returnDate: string;
  companion: string;
  hospital: string;
  notes: string;
  items: TravelItem[];
};

const STORAGE_KEY = 'preggy:travel-ready';

const defaultItems: TravelItem[] = [
  {
    id: 'provider',
    title: 'Check with my care provider',
    icon: 'medical-outline',
    complete: false,
  },
  {
    id: 'records',
    title: 'Save pregnancy records and contacts',
    icon: 'documents-outline',
    complete: false,
  },
  {
    id: 'insurance',
    title: 'Check health and travel cover',
    icon: 'shield-checkmark-outline',
    complete: false,
  },
  {
    id: 'medication',
    title: 'Pack medication and supplements',
    icon: 'medkit-outline',
    complete: false,
  },
  {
    id: 'water',
    title: 'Plan water and suitable snacks',
    icon: 'water-outline',
    complete: false,
  },
  {
    id: 'movement',
    title: 'Plan regular movement breaks',
    icon: 'walk-outline',
    complete: false,
  },
  {
    id: 'comfort',
    title: 'Pack pregnancy comfort items',
    icon: 'heart-outline',
    complete: false,
  },
  {
    id: 'hospital',
    title: 'Find maternity care near destination',
    icon: 'location-outline',
    complete: false,
  },
];

export default function TravelReadyScreen() {
  const { palette } = useAppTheme();

  const [destination, setDestination] = useState('');
  const [departure, setDeparture] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [companion, setCompanion] = useState('');
  const [hospital, setHospital] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TravelItem[]>(defaultItems);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;

        const saved = JSON.parse(value) as TravelPlan;

        setDestination(saved.destination ?? '');
        setDeparture(saved.departure ?? '');
        setReturnDate(saved.returnDate ?? '');
        setCompanion(saved.companion ?? '');
        setHospital(saved.hospital ?? '');
        setNotes(saved.notes ?? '');
        setItems(
          Array.isArray(saved.items) && saved.items.length
            ? saved.items
            : defaultItems
        );
      })
      .catch((error) => {
        console.log('Travel Ready load error:', error);
      });
  }, []);

  const completed = useMemo(
    () => items.filter((item) => item.complete).length,
    [items]
  );

  const progress = items.length
    ? Math.round((completed / items.length) * 100)
    : 0;

  function toggleItem(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, complete: !item.complete }
          : item
      )
    );
  }

  async function savePlan(showAlert = true) {
    if (!destination.trim()) {
      Alert.alert(
        'Add your destination',
        'Enter where you are travelling first.'
      );
      return false;
    }

    const plan: TravelPlan = {
      destination: destination.trim(),
      departure: departure.trim(),
      returnDate: returnDate.trim(),
      companion: companion.trim(),
      hospital: hospital.trim(),
      notes: notes.trim(),
      items,
    };

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(plan)
      );

      if (showAlert) {
        Alert.alert(
          'Travel plan saved',
          'Your pregnancy travel plan is stored on this phone.'
        );
      }

      return true;
    } catch (error) {
      console.log('Travel Ready save error:', error);
      Alert.alert('Could not save', 'Please try again.');
      return false;
    }
  }

  async function sharePlan() {
    if (!destination.trim()) {
      Alert.alert('Add your destination first');
      return;
    }

    await savePlan(false);

    const lines = [
      'Preggy Travel Plan',
      '',
      'Destination: ' + destination.trim(),
      departure.trim() ? 'Departure: ' + departure.trim() : null,
      returnDate.trim() ? 'Return: ' + returnDate.trim() : null,
      companion.trim() ? 'Companion: ' + companion.trim() : null,
      hospital.trim() ? 'Nearby care: ' + hospital.trim() : null,
      '',
      'Readiness: ' + String(progress) + '%',
      '',
      ...items.map(
        (item) =>
          (item.complete ? '✓ ' : '○ ') + item.title
      ),
      notes.trim() ? '' : null,
      notes.trim() ? 'Notes: ' + notes.trim() : null,
      '',
      'Prepared with Preggy.',
    ].filter(Boolean) as string[];

    await Share.share({
      title: 'Preggy Travel Plan',
      message: lines.join('\n'),
    });
  }

  return (
    <Screen bottomSpace={80}>
      <Header title="Travel Ready" back />

      <View
        style={[
          styles.hero,
          { backgroundColor: palette.accent },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="airplane-outline"
              size={31}
              color={palette.onAccent}
            />
          </View>

          <View
            style={[
              styles.progressBadge,
              { backgroundColor: palette.onAccent },
            ]}
          >
            <Text
              style={[
                styles.progressValue,
                { color: palette.accent },
              ]}
            >
              {progress}%
            </Text>
            <Text
              style={[
                styles.progressLabel,
                { color: palette.accent },
              ]}
            >
              ready
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          Travel with a calmer plan.
        </Text>

        <Text
          style={[
            styles.heroCopy,
            { color: palette.onAccent },
          ]}
        >
          Keep trip details, pregnancy essentials and nearby care in one place.
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: (progress + '%') as any },
            ]}
          />
        </View>

        <Text
          style={[
            styles.progressCopy,
            { color: palette.onAccent },
          ]}
        >
          {completed} of {items.length} checks completed
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.kicker, { color: palette.accent }]}>
          TRIP DETAILS
        </Text>
        <Text style={[styles.title, { color: palette.ink }]}>
          Where are you going?
        </Text>

        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="Destination"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <View style={styles.row}>
          <TextInput
            value={departure}
            onChangeText={setDeparture}
            placeholder="Departure"
            placeholderTextColor={palette.muted}
            style={[
              styles.rowInput,
              {
                backgroundColor: palette.canvas,
                borderColor: palette.line,
                color: palette.ink,
              },
            ]}
          />

          <TextInput
            value={returnDate}
            onChangeText={setReturnDate}
            placeholder="Return"
            placeholderTextColor={palette.muted}
            style={[
              styles.rowInput,
              {
                backgroundColor: palette.canvas,
                borderColor: palette.line,
                color: palette.ink,
              },
            ]}
          />
        </View>

        <TextInput
          value={companion}
          onChangeText={setCompanion}
          placeholder="Travel companion"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            styles.spacing,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: palette.accent }]}>
              READINESS CHECKLIST
            </Text>
            <Text style={[styles.title, { color: palette.ink }]}>
              Prepare before leaving
            </Text>
          </View>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Text style={[styles.countText, { color: palette.accent }]}>
              {completed}/{items.length}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <AnimatedPressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              style={[
                styles.item,
                {
                  backgroundColor: item.complete
                    ? palette.accentSoft
                    : palette.canvas,
                  borderColor: item.complete
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.itemIcon,
                  {
                    backgroundColor: item.complete
                      ? palette.accent
                      : palette.surface,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={
                    item.complete
                      ? palette.onAccent
                      : palette.muted
                  }
                />
              </View>

              <Text
                style={[
                  styles.itemText,
                  { color: palette.ink },
                ]}
              >
                {item.title}
              </Text>

              <Ionicons
                name={
                  item.complete
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={23}
                color={
                  item.complete
                    ? palette.accent
                    : palette.muted
                }
              />
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.kicker, { color: palette.accent }]}>
          CARE & NOTES
        </Text>
        <Text style={[styles.title, { color: palette.ink }]}>
          Important information
        </Text>

        <TextInput
          value={hospital}
          onChangeText={setHospital}
          placeholder="Nearby clinic or hospital"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Medication times, travel notes or instructions..."
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.notes,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          onPress={() => savePlan()}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="save-outline"
            size={21}
            color={palette.accent}
          />
          <Text style={[styles.buttonText, { color: palette.ink }]}>
            Save travel plan
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={sharePlan}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="share-outline"
            size={21}
            color={palette.onAccent}
          />
          <Text
            style={[
              styles.buttonText,
              { color: palette.onAccent },
            ]}
          >
            Share travel plan
          </Text>
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.notice,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={palette.accent}
        />
        <Text style={[styles.noticeText, { color: palette.text }]}>
          Travel guidance depends on your pregnancy and destination. Check with your care provider and transport company.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 23,
    marginTop: 12,
    marginBottom: 15,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 23,
  },
  heroIcon: {
    width: 63,
    height: 63,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadge: {
    minWidth: 70,
    height: 60,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    ...type.title,
    fontSize: 21,
    lineHeight: 23,
  },
  progressLabel: {
    ...type.tiny,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 40,
  },
  heroCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 8,
    opacity: 0.88,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden',
    marginTop: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  progressCopy: {
    ...type.small,
    marginTop: 9,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 15,
  },
  kicker: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 3,
    marginBottom: 15,
  },
  input: {
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 15,
    ...type.body,
  },
  spacing: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rowInput: {
    flex: 1,
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 13,
    ...type.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  countBadge: {
    minWidth: 53,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...type.bodyStrong,
  },
  list: {
    gap: 9,
  },
  item: {
    minHeight: 67,
    borderWidth: 1,
    borderRadius: 20,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    ...type.small,
    flex: 1,
    marginHorizontal: 11,
  },
  notes: {
    minHeight: 115,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginTop: 10,
    ...type.body,
  },
  actions: {
    gap: 10,
  },
  secondaryButton: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: {
    ...type.bodyStrong,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    ...type.small,
    lineHeight: 19,
    flex: 1,
  },
});
