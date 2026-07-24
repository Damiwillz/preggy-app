import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BumpPhoto = {
  id: string;
  week: number;
  note: string;
  imageUri: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:bump-gallery';
const PHOTO_DIRECTORY = `${FileSystem.documentDirectory ?? ''}bump-gallery/`;

function parsePhotos(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BumpPhoto[]) : [];
  } catch {
    return [];
  }
}

function getFileExtension(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const parts = cleanUri.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';

  if (extension === 'png') return 'png';
  if (extension === 'webp') return 'webp';
  if (extension === 'jpeg') return 'jpg';

  return 'jpg';
}

function formatDate(value: number) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function copyPhotoToApp(uri: string) {
  if (!FileSystem.documentDirectory) {
    return uri;
  }

  await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, {
    intermediates: true,
  });

  const extension = getFileExtension(uri);
  const nextUri = `${PHOTO_DIRECTORY}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  await FileSystem.copyAsync({
    from: uri,
    to: nextUri,
  });

  return nextUri;
}

export default function BumpGalleryScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [photos, setPhotos] = useState<BumpPhoto[]>([]);
  const [week, setWeek] = useState('');
  const [note, setNote] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPhotos() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setPhotos(parsePhotos(saved));
      } catch (error) {
        console.log('Bump gallery load error:', error);
      }
    }

    void loadPhotos();
  }, []);

  const latestPhoto = photos[0] ?? null;

  async function savePhotos(nextPhotos: BumpPhoto[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPhotos));
    } catch (error) {
      console.log('Bump gallery save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  async function choosePhoto() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Please allow photo access so you can choose a bump photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setSelectedImageUri(result.assets[0].uri);
    } catch (error) {
      console.log('Bump photo picker error:', error);
      Alert.alert('Could not open photos', 'Please try again.');
    }
  }

  async function addPhoto() {
    const cleanWeek = Number(week.replace(/[^0-9]/g, ''));

    if (!selectedImageUri) {
      Alert.alert('Choose a photo', 'Pick a bump photo first.');
      return;
    }

    if (!Number.isFinite(cleanWeek) || cleanWeek < 1 || cleanWeek > 42) {
      Alert.alert('Add week number', 'Enter a pregnancy week between 1 and 42.');
      return;
    }

    try {
      setSaving(true);

      const savedImageUri = await copyPhotoToApp(selectedImageUri);

      const nextPhoto: BumpPhoto = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        week: cleanWeek,
        note: note.trim(),
        imageUri: savedImageUri,
        createdAt: Date.now(),
      };

      const nextPhotos = [nextPhoto, ...photos];

      setPhotos(nextPhotos);
      await savePhotos(nextPhotos);

      setWeek('');
      setNote('');
      setSelectedImageUri('');
    } catch (error) {
      console.log('Bump photo save error:', error);
      Alert.alert('Could not save photo', 'Please try again in a moment.');
    } finally {
      setSaving(false);
    }
  }

  function removePhoto(photo: BumpPhoto) {
    Alert.alert('Delete photo?', 'This will remove it from your bump gallery.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const nextPhotos = photos.filter((item) => item.id !== photo.id);

          setPhotos(nextPhotos);
          await savePhotos(nextPhotos);

          if (photo.imageUri.startsWith(FileSystem.documentDirectory ?? '')) {
            FileSystem.deleteAsync(photo.imageUri, { idempotent: true }).catch((error) => {
              console.log('Bump photo delete file error:', error);
            });
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title="Bump Gallery" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="image-outline" size={26} color={palette.accent} />
        </View>

        <Text style={styles.eyebrow}>MEMORIES</Text>
        <Text style={styles.title}>Bump gallery</Text>
        <Text style={styles.copy}>Save weekly bump photos and small notes as your pregnancy changes.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{photos.length}</Text>
          <Text style={styles.summaryLabel}>photos</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{latestPhoto ? `Week ${latestPhoto.week}` : '--'}</Text>
          <Text style={styles.summaryLabel}>latest</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add a bump photo</Text>

        <AnimatedPressable onPress={choosePhoto} style={styles.photoPicker}>
          {selectedImageUri ? (
            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.emptyPicker}>
              <Ionicons name="camera-outline" size={28} color={palette.accent} />
              <Text style={styles.emptyPickerText}>Choose photo</Text>
            </View>
          )}
        </AnimatedPressable>

        <TextInput
          value={week}
          onChangeText={setWeek}
          placeholder="Pregnancy week, example 20"
          placeholderTextColor={palette.muted}
          keyboardType="number-pad"
          style={styles.input}
        />

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note, optional"
          placeholderTextColor={palette.muted}
          multiline
          style={[styles.input, styles.noteInput]}
        />

        <AnimatedPressable onPress={addPhoto} disabled={saving} style={styles.primaryButton}>
          <Ionicons name="add-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save photo'}</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionLabel}>YOUR PHOTOS</Text>

      {photos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="images-outline" size={30} color={palette.accent} />
          <Text style={styles.emptyTitle}>No bump photos yet</Text>
          <Text style={styles.emptyCopy}>Add your first photo above to start your weekly gallery.</Text>
        </View>
      ) : (
        <View style={styles.galleryGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.imageUri }} style={styles.photoImage} />

              <View style={styles.photoBody}>
                <View style={styles.photoTop}>
                  <View>
                    <Text style={styles.photoWeek}>Week {photo.week}</Text>
                    <Text style={styles.photoDate}>{formatDate(photo.createdAt)}</Text>
                  </View>

                  <AnimatedPressable onPress={() => removePhoto(photo)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={18} color={palette.muted} />
                  </AnimatedPressable>
                </View>

                {photo.note ? <Text style={styles.photoNote}>{photo.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

type AppPalette = ReturnType<typeof useAppTheme>['palette'];

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    hero: {
      borderRadius: 30,
      padding: 22,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginTop: 12,
      marginBottom: 14,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
      marginBottom: 16,
    },
    eyebrow: {
      ...type.section,
      color: palette.accent,
      marginBottom: 4,
    },
    title: {
      ...type.title,
      color: palette.ink,
    },
    copy: {
      ...type.body,
      color: palette.text,
      marginTop: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.accentSoft,
      borderWidth: 1,
      borderColor: palette.line,
    },
    summaryValue: {
      ...type.bodyStrong,
      color: palette.ink,
      fontSize: 20,
    },
    summaryLabel: {
      ...type.tiny,
      color: palette.text,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    card: {
      borderRadius: 28,
      padding: 18,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 16,
    },
    cardTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginBottom: 12,
      fontSize: 18,
    },
    photoPicker: {
      height: 220,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: palette.canvas,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 12,
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    emptyPicker: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyPickerText: {
      ...type.bodyStrong,
      color: palette.accent,
    },
    input: {
      ...type.body,
      color: palette.ink,
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.line,
      backgroundColor: palette.canvas,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    noteInput: {
      minHeight: 96,
      paddingTop: 14,
      textAlignVertical: 'top',
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 20,
      backgroundColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButtonText: {
      ...type.bodyStrong,
      color: palette.onAccent,
    },
    sectionLabel: {
      ...type.section,
      color: palette.accent,
      marginBottom: 10,
      marginTop: 4,
    },
    emptyCard: {
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    emptyTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginTop: 12,
    },
    emptyCopy: {
      ...type.small,
      color: palette.text,
      textAlign: 'center',
      marginTop: 4,
    },
    galleryGrid: {
      gap: 14,
    },
    photoCard: {
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    photoImage: {
      width: '100%',
      height: 250,
    },
    photoBody: {
      padding: 15,
    },
    photoTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    photoWeek: {
      ...type.bodyStrong,
      color: palette.ink,
      fontSize: 18,
    },
    photoDate: {
      ...type.tiny,
      color: palette.text,
      marginTop: 3,
      textTransform: 'uppercase',
    },
    photoNote: {
      ...type.small,
      color: palette.text,
      marginTop: 10,
    },
    deleteButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.canvas,
    },
  });
}
