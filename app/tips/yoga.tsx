import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const poses = [
  {
    title: 'Cat-cow stretch',
    time: '3 min',
    image: require('../../assets/images/tips-yoga-catcow.jpg'),
    copy: 'Move slowly with your breath to ease back tension.',
  },
  {
    title: 'Child’s pose support',
    time: '4 min',
    image: require('../../assets/images/tips-yoga-childpose.jpg'),
    copy: 'Use pillows or blocks to create space and comfort.',
  },
  {
    title: 'Supported warrior',
    time: '5 min',
    image: require('../../assets/images/tips-yoga-warrior.jpg'),
    copy: 'Build gentle strength while keeping your stance steady.',
  },
];

export default function YogaScreen() {
  const { palette } = useAppTheme();
  const [selectedPose, setSelectedPose] = useState(poses[0].title);

  return (
    <Screen bottomSpace={44}>
      <Header title="Prenatal Yoga" back />

      <View style={styles.hero}>
        <Image source={require('../../assets/images/tips-yoga-hero.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient colors={['rgba(40,20,26,0.04)', 'rgba(40,20,26,0.74)']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.heroText}>
          <Text style={styles.kicker}>GENTLE MOVEMENT</Text>
          <Text style={styles.heroTitle}>Move softly with your changing body</Text>
          <Text style={styles.heroCopy}>Short prenatal-friendly poses for comfort, breath, and calm.</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.accent }]}>12</Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Minutes</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.accent }]}>3</Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Gentle poses</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.accent }]}>Low</Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Intensity</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Today’s flow</Text>

      <View style={styles.poseList}>
        {poses.map((pose, index) => {
          const active = selectedPose === pose.title;

          return (
            <AnimatedPressable
              key={pose.title}
              onPress={() => setSelectedPose(pose.title)}
              style={[styles.poseCard, { backgroundColor: active ? palette.accentSoft : palette.surface, borderColor: active ? palette.accent : palette.line }]}
            >
              <View style={styles.poseImageWrap}>
                <Image source={pose.image} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.poseTop}>
                  <Text style={[styles.poseStep, { color: palette.accent }]}>POSE {index + 1}</Text>
                  <Text style={[styles.poseTime, { color: palette.muted }]}>{pose.time}</Text>
                </View>

                <Text style={[styles.poseTitle, { color: palette.ink }]}>{pose.title}</Text>
                <Text style={[styles.poseCopy, { color: palette.text }]}>{pose.copy}</Text>
              </View>

              <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={active ? palette.accent : palette.muted} />
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="alert-circle-outline" size={21} color={colors.plum} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Move within comfort only. Stop if you feel pain, dizziness, bleeding, contractions, or shortness of breath, and check with your clinician.
        </Text>
      </View>

      <AnimatedPressable style={[styles.completeButton, { backgroundColor: palette.accent }]}>
        <Ionicons name="play" size={20} color="#fff" />
        <Text style={[styles.completeText, { color: palette.onAccent }]}>Start gentle flow</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 300,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  heroText: {
    padding: 24,
  },
  kicker: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  heroTitle: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    color: '#fff',
    marginTop: 7,
  },
  heroCopy: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    maxWidth: 310,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  summaryValue: {
    ...type.bodyStrong,
    color: colors.plum,
    fontSize: 20,
  },
  summaryLabel: {
    ...type.tiny,
    color: colors.text,
    marginTop: 3,
    fontWeight: '900',
  },
  sectionTitle: {
    ...type.title,
    fontSize: 25,
    color: colors.ink,
    marginTop: 26,
    marginBottom: 12,
  },
  poseList: {
    gap: 12,
  },
  poseCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
  },
  poseCardActive: {
    backgroundColor: '#FFF0F1',
    borderColor: '#EFDCDD',
  },
  poseImageWrap: {
    width: 78,
    height: 82,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF0F1',
  },
  poseTop: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  poseStep: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
  },
  poseTime: {
    ...type.tiny,
    color: colors.muted,
    fontWeight: '900',
  },
  poseTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 4,
  },
  poseCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    lineHeight: 19,
  },
  note: {
    marginTop: 20,
    backgroundColor: '#FFF0F1',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 12,
  },
  noteText: {
    ...type.small,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
    fontWeight: '700',
  },
  completeButton: {
    marginTop: 24,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  completeText: {
    ...type.bodyStrong,
    color: '#fff',
  },
});
