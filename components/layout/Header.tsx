import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { signOut } from '@/services/auth';
import { uploadMyAvatar } from '@/services/avatar';
import { isGuestMode } from '@/services/guest';
import {
  getMyProfile,
  type UserProfile,
} from '@/services/profile';

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle: string;
  onPress: () => void;
};

const fallbackAvatar = require('../../assets/images/profile-avatar.jpg');

export function Header({
  title = 'Preggers',
  back = false,
  showAvatar = true,
}: {
  title?: string;
  back?: boolean;
  showAvatar?: boolean;
}) {
  const { palette } = useAppTheme();

  const [menuVisible, setMenuVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!showAvatar) {
      return;
    }

    let active = true;

    getMyProfile()
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (active) {
          setProfile(null);
        }
      });

    return () => {
      active = false;
    };
  }, [showAvatar]);

  useEffect(() => {
    if (!menuVisible) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(30);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 20,
        stiffness: 210,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuVisible, opacity, translateY]);

  const displayName = profile?.full_name || 'Your profile';
  const firstName =
    displayName === 'Your profile'
      ? 'your account'
      : displayName.split(' ')[0];

  const week = profile?.pregnancy_week ?? 24;
  const progress = Math.min(100, Math.max(0, Math.round((week / 40) * 100)));
  const progressWidth = `${progress}%` as `${number}%`;

  const avatarSource: ImageSourcePropType = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : fallbackAvatar;

  function closeMenu(afterClose?: () => void) {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 24,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      afterClose?.();
    });
  }

  function navigate(path: string) {
    closeMenu(() => router.push(path as never));
  }

  function confirmLogout() {
    closeMenu(() => {
      Alert.alert(
        'Log out?',
        'You can sign back in anytime using your account.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Log out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/auth/log-in');
              } catch {
                Alert.alert(
                  'Logout failed',
                  'Please try again.'
                );
              }
            },
          },
        ]
      );
    });
  }

  function changeProfilePhoto() {
    setMenuVisible(false);

    setTimeout(async () => {
      try {
        if (await isGuestMode()) {
          Alert.alert(
            'Create an account to save photos',
            'Guest mode keeps your profile local.'
          );
          return;
        }

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Photo permission needed',
            'Allow photo access to choose a profile picture.'
          );
          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
            presentationStyle:
              ImagePicker.UIImagePickerPresentationStyle
                .FULL_SCREEN,
          });

        if (result.canceled || !result.assets[0]?.uri) {
          return;
        }

        setAvatarUploading(true);

        const avatarUrl = await uploadMyAvatar(
          result.assets[0].uri
        );

        setProfile((current) =>
          current
            ? {
                ...current,
                avatar_url: avatarUrl,
              }
            : current
        );

        Alert.alert(
          'Photo updated',
          'Your new profile photo has been saved.'
        );
      } catch (error) {
        console.log('Avatar upload error:', error);

        Alert.alert(
          'Upload failed',
          'We could not update your photo.'
        );
      } finally {
        setAvatarUploading(false);
      }
    }, 350);
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Profile',
      subtitle: 'Personal and pregnancy details',
      onPress: () => navigate('/(tabs)/profile'),
    },
    {
      icon: 'camera-outline',
      label: avatarUploading ? 'Uploading photo...' : 'Profile photo',
      subtitle: 'Choose a new profile picture',
      onPress: changeProfilePhoto,
    },
    {
      icon: 'calendar-outline',
      label: 'Appointments',
      subtitle: 'Visits, scans and notes',
      onPress: () => navigate('/(tabs)/appointments'),
    },
    {
      icon: 'medical-outline',
      label: 'Medication',
      subtitle: 'Supplements and daily doses',
      onPress: () => navigate('/medication'),
    },
    {
      icon: 'sparkles-outline',
      label: 'Preggy AI',
      subtitle: 'Ask a pregnancy question',
      onPress: () => navigate('/ai-chat'),
    },
    {
      icon: 'contrast-outline',
      label: 'Appearance',
      subtitle: 'Theme and accent color',
      onPress: () => navigate('/appearance'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy',
      subtitle: 'Security and your information',
      onPress: () => navigate('/privacy'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help and FAQ',
      subtitle: 'Answers and app support',
      onPress: () => navigate('/support/faq'),
    },
  ];

  return (
    <>
      <View style={styles.header}>
        {back ? (
          <AnimatedPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[
              styles.navigationButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={palette.ink}
            />
          </AnimatedPressable>
        ) : (
          <View style={styles.logo}>
            <View
              style={[
                styles.logoMark,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Ionicons
                name="heart"
                size={17}
                color={palette.accent}
              />
            </View>

            <Text style={[styles.brand, { color: palette.ink }]}>
              {title}
            </Text>
          </View>
        )}

        {back ? (
          <Text
            style={[styles.pageTitle, { color: palette.ink }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}

        {showAvatar ? (
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [
              styles.avatarTouchTarget,
              pressed && styles.avatarPressed,
            ]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open profile menu"
          >
            <View
              style={[
                styles.avatarRing,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.line,
                },
              ]}
            >
              <Image
                source={avatarSource}
                style={styles.avatar}
                resizeMode="cover"
              />

              <View
                style={[
                  styles.onlineDot,
                  { borderColor: palette.surface },
                ]}
              />
            </View>
          </Pressable>
        ) : (
          <View style={styles.avatarSpacer} />
        )}
      </View>

      <Modal
        transparent
        visible={showAvatar && menuVisible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeMenu()}
      >
        <View style={styles.modalRoot}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeMenu()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.elevated,
                borderColor: palette.line,
                shadowColor: palette.ink,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: palette.line },
              ]}
            />

            <View style={styles.accountHeader}>
              <View
                style={[
                  styles.menuAvatarRing,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Image
                  source={avatarSource}
                  style={styles.menuAvatar}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.accountText}>
                <Text
                  style={[
                    styles.accountName,
                    { color: palette.ink },
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

                <Text
                  style={[
                    styles.accountMeta,
                    { color: palette.text },
                  ]}
                >
                  Week {week} · {progress}% complete
                </Text>
              </View>

              <AnimatedPressable
                onPress={() => closeMenu()}
                accessibilityLabel="Close profile menu"
                style={[
                  styles.closeButton,
                  { backgroundColor: palette.softSurface },
                ]}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={palette.text}
                />
              </AnimatedPressable>
            </View>

            <View
              style={[
                styles.progressCard,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.progressIcon,
                  { backgroundColor: palette.surface },
                ]}
              >
                <Ionicons
                  name="heart"
                  size={17}
                  color={palette.accent}
                />
              </View>

              <View style={styles.progressContent}>
                <View style={styles.progressHeading}>
                  <Text
                    style={[
                      styles.progressTitle,
                      { color: palette.ink },
                    ]}
                  >
                    Pregnancy journey
                  </Text>

                  <Text
                    style={[
                      styles.progressValue,
                      { color: palette.accent },
                    ]}
                  >
                    {progress}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: palette.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: progressWidth,
                        backgroundColor: palette.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuList}
            >
              {menuItems.map((item) => (
                <AnimatedPressable
                  key={item.label}
                  onPress={item.onPress}
                  style={[
                    styles.menuRow,
                    { borderBottomColor: palette.line },
                  ]}
                >
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: palette.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={palette.accent}
                    />
                  </View>

                  <View style={styles.menuText}>
                    <Text
                      style={[
                        styles.menuLabel,
                        { color: palette.ink },
                      ]}
                    >
                      {item.label}
                    </Text>

                    <Text
                      style={[
                        styles.menuSubtitle,
                        { color: palette.muted },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={palette.muted}
                  />
                </AnimatedPressable>
              ))}

              <AnimatedPressable
                onPress={confirmLogout}
                style={[
                  styles.logoutButton,
                  { backgroundColor: palette.softSurface },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={palette.danger}
                />

                <Text
                  style={[
                    styles.logoutText,
                    { color: palette.danger },
                  ]}
                >
                  Log out {firstName}
                </Text>
              </AnimatedPressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...type.brand,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.8,
  },
  navigationButton: {
    width: 44,
    height: 44,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    ...type.bodyStrong,
    fontSize: 17,
    position: 'absolute',
    left: 60,
    right: 60,
    textAlign: 'center',
  },
  avatarTouchTarget: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.95 }],
  },
  avatarRing: {
    width: 47,
    height: 47,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 16,
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#55B987',
    borderWidth: 2,
  },
  avatarSpacer: {
    width: 44,
    height: 44,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 13, 18, 0.48)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 22,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  menuAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatar: {
    width: 52,
    height: 52,
    borderRadius: 19,
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    ...type.bodyStrong,
    fontSize: 19,
  },
  accountMeta: {
    ...type.small,
    marginTop: 2,
  },
  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 13,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  progressIcon: {
    width: 39,
    height: 39,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContent: {
    flex: 1,
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    ...type.small,
  },
  progressValue: {
    ...type.small,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  menuList: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  menuRow: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  menuIcon: {
    width: 41,
    height: 41,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    ...type.bodyStrong,
    fontSize: 15,
  },
  menuSubtitle: {
    ...type.tiny,
    marginTop: 2,
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 17,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    ...type.bodyStrong,
  },
});
