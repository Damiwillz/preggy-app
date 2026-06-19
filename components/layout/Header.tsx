import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BackIcon, HeartIcon } from '@/components/ui/icons';
import { getMyProfile, type UserProfile } from '@/services/profile';
import { signOut } from '@/services/auth';

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  onPress: () => void;
};

export function Header({
  title = 'Preggers',
  back = false,
  showAvatar = true,
}: {
  title?: string;
  back?: boolean;
  showAvatar?: boolean;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!showAvatar) return;

    let active = true;

    getMyProfile()
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch(() => {
        if (active) setProfile(null);
      });

    return () => {
      active = false;
    };
  }, [showAvatar]);

  useEffect(() => {
    if (!menuVisible) return;

    opacity.setValue(0);
    translateY.setValue(-12);
    scale.setValue(0.96);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 18,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuVisible, opacity, scale, translateY]);

  const displayName = profile?.full_name || 'Sarah Miller';
  const firstName = displayName.split(' ')[0] || 'Sarah';
  const week = profile?.pregnancy_week ?? 24;

  const closeMenu = (afterClose?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -8,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      afterClose?.();
    });
  };

  const navigate = (path: string) => closeMenu(() => router.push(path as never));

  const confirmLogout = () => {
    closeMenu(() => {
      Alert.alert('Log out?', 'You can sign back in anytime using your account.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/log-in');
            } catch {
              Alert.alert('Logout failed', 'Please try again.');
            }
          },
        },
      ]);
    });
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'View profile',
      subtitle: 'Pregnancy details and progress',
      onPress: () => navigate('/(tabs)/profile'),
    },
    {
      icon: 'camera-outline',
      label: 'Change profile photo',
      subtitle: 'Upload a real profile picture',
      onPress: () =>
        closeMenu(() =>
          Alert.alert(
            'Coming next',
            'Next step, we will add image picker and Supabase Storage so you can upload a real profile picture.',
          ),
        ),
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
      icon: 'shield-checkmark-outline',
      label: 'Data privacy',
      subtitle: 'Security, downloads and permissions',
      onPress: () => navigate('/privacy'),
    },
    {
      icon: 'contrast-outline',
      label: 'Appearance',
      subtitle: 'Light and dark mode',
      onPress: () => navigate('/appearance'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & FAQ',
      subtitle: 'Support and common questions',
      onPress: () =>
        closeMenu(() =>
          Alert.alert(
            'Help & FAQ',
            'Support resources, pregnancy guidance, account help and frequently asked questions will appear here.',
          ),
        ),
    },
  ];

  return (
    <>
      <View style={styles.header}>
        {back ? (
          <AnimatedPressable onPress={() => router.back()} style={styles.circle}>
            <BackIcon />
          </AnimatedPressable>
        ) : (
          <View style={styles.logo}>
            <HeartIcon size={20} />
            <Text style={styles.brand}>{title}</Text>
          </View>
        )}

        {back ? <Text style={styles.pageTitle}>{title}</Text> : <View />}

        {showAvatar ? (
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [styles.avatarTouchTarget, pressed && styles.avatarPressed]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Open profile menu"
            accessibilityHint="Opens account shortcuts and settings"
          >
            <View style={styles.avatarButton} pointerEvents="none">
              <Image
                source={require('../../assets/images/profile-avatar.jpg')}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.onlineDot} />
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
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />
          </Animated.View>

          <Animated.View
            style={[
              styles.menu,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <View style={styles.menuArrow} />

            <View style={styles.accountHeader}>
              <Image
                source={require('../../assets/images/profile-avatar.jpg')}
                style={styles.menuAvatar}
                resizeMode="cover"
              />

              <View style={styles.accountText}>
                <Text style={styles.accountName}>{displayName}</Text>
                <Text style={styles.accountMeta}>{week} weeks pregnant</Text>
              </View>

              <AnimatedPressable
                style={styles.closeButton}
                onPress={() => closeMenu()}
                accessibilityLabel="Close profile menu"
              >
                <Ionicons name="close" size={20} color="#6E555F" />
              </AnimatedPressable>
            </View>

            <View style={styles.progressPill}>
              <View style={styles.progressIcon}>
                <Ionicons name="heart" size={16} color="#8C4A65" />
              </View>

              <View style={styles.progressTextWrap}>
                <Text style={styles.progressTitle}>Week {week} progress</Text>
                <View style={styles.progressTrack}>
                  <View style={styles.progressFill} />
                </View>
              </View>

              <Text style={styles.progressValue}>62%</Text>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <AnimatedPressable key={item.label} onPress={item.onPress} style={styles.menuRow}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={21} color="#765963" />
                  </View>

                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#B49FA5" />
                </AnimatedPressable>
              ))}
            </View>

            <AnimatedPressable onPress={confirmLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#B23A48" />
              <Text style={styles.logoutText}>Log out {firstName}</Text>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    elevation: 12,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brand: {
    ...type.brand,
    color: colors.plum,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  pageTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    position: 'absolute',
    left: 68,
    right: 68,
    textAlign: 'center',
  },
  avatarTouchTarget: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 8,
  },
  avatarSpacer: {
    width: 56,
    height: 56,
  },
  avatarPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F6',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.blush,
  },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#56B884',
    borderWidth: 2,
    borderColor: '#FFF8F6',
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(36, 22, 28, 0.38)',
  },
  menu: {
    position: 'absolute',
    top: 88,
    right: 18,
    width: '88%',
    maxWidth: 390,
    maxHeight: '84%',
    backgroundColor: '#FFFDFC',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#2B1720',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 30,
    elevation: 18,
  },
  menuArrow: {
    position: 'absolute',
    right: 17,
    top: -8,
    width: 18,
    height: 18,
    backgroundColor: '#FFFDFC',
    transform: [{ rotate: '45deg' }],
    borderTopLeftRadius: 4,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 12,
  },
  menuAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#F3CFD2',
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    ...type.bodyStrong,
    fontSize: 18,
    color: '#2E2025',
  },
  accountMeta: {
    ...type.small,
    color: '#7B6970',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8EEEE',
  },
  progressPill: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextWrap: {
    flex: 1,
  },
  progressTitle: {
    ...type.small,
    color: '#57434A',
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8D5D9',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    width: '62%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#8C6370',
  },
  progressValue: {
    ...type.bodyStrong,
    color: '#6B4E58',
  },
  menuList: {
    marginTop: 10,
  },
  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFE5E7',
    paddingVertical: 7,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAEFF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    ...type.bodyStrong,
    color: '#33272B',
  },
  menuSubtitle: {
    ...type.tiny,
    color: '#8B7B80',
    marginTop: 1,
  },
  logoutButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: '#FFF0F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    ...type.bodyStrong,
    color: '#B23A48',
  },
});