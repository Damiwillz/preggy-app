import React from 'react';
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { screenPad } from '@/utils/responsive';

type Props = ViewProps & { scroll?: boolean; children: React.ReactNode; bottomSpace?: number };
export function Screen({ children, scroll = true, bottomSpace = 120, style }: Props) {
  const content = <View style={[styles.content, { paddingBottom: bottomSpace }, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { paddingHorizontal: screenPad, paddingTop: 10 } });
