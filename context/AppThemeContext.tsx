import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { supabase } from '@/lib/supabase';
import { getMyPrivacySettings, updateMyPrivacySettings } from '@/services/privacy';

type AppearanceMode = 'system' | 'light' | 'dark';
type AccentColor = 'rose' | 'plum' | 'peach' | 'mint';

type Palette = {
  isDark: boolean;
  canvas: string;
  surface: string;
  elevated: string;
  softSurface: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentMuted: string;
  onAccent: string;
  ink: string;
  text: string;
  muted: string;
  line: string;
  tab: string;
  success: string;
  warning: string;
  danger: string;
};

type AppThemeContextValue = {
  mode: AppearanceMode;
  accentColor: AccentColor;
  palette: Palette;
  refreshTheme: () => Promise<void>;
  setMode: (mode: AppearanceMode) => Promise<void>;
  setAccentColor: (accent: AccentColor) => Promise<void>;
};

const accentMap: Record<AccentColor, { light: string; dark: string; strongLight: string; strongDark: string; softLight: string; softDark: string }> = {
  rose: {
    light: '#C96D73',
    dark: '#F5A6B4',
    strongLight: '#765B60',
    strongDark: '#FFCAD4',
    softLight: '#FFE2E7',
    softDark: '#4B2832',
  },
  plum: {
    light: '#6E4460',
    dark: '#DFA8CE',
    strongLight: '#5E2C4D',
    strongDark: '#F3C5E3',
    softLight: '#F1DCEB',
    softDark: '#422238',
  },
  peach: {
    light: '#C97951',
    dark: '#F6B68F',
    strongLight: '#8C4B2F',
    strongDark: '#FFD2B8',
    softLight: '#FFE3D4',
    softDark: '#4B2B20',
  },
  mint: {
    light: '#5E8E6B',
    dark: '#A6D7B0',
    strongLight: '#3E704B',
    strongDark: '#C5EBCB',
    softLight: '#DFF3E4',
    softDark: '#213D2A',
  },
};

function applyNativeMode(mode: AppearanceMode) {
  const nativeAppearance = Appearance as typeof Appearance & {
    setColorScheme?: (scheme: 'light' | 'dark' | null) => void;
  };

  if (mode === 'light') {
    nativeAppearance.setColorScheme?.('light');
    return;
  }

  if (mode === 'dark') {
    nativeAppearance.setColorScheme?.('dark');
    return;
  }

  nativeAppearance.setColorScheme?.(null);
}

function buildPalette(isDark: boolean, accentColor: AccentColor): Palette {
  const accent = accentMap[accentColor];

  return {
    isDark,
    canvas: isDark ? '#100B0E' : '#FFF8F5',
    surface: isDark ? '#191216' : '#FFFFFF',
    elevated: isDark ? '#22191E' : '#FFFFFF',
    softSurface: isDark ? '#2B2026' : '#FFF0EC',
    accent: isDark ? accent.dark : accent.light,
    accentStrong: isDark ? accent.strongDark : accent.strongLight,
    accentSoft: isDark ? accent.softDark : accent.softLight,
    accentMuted: isDark ? '#B8919F' : '#A87C86',
    onAccent: isDark ? '#241219' : '#FFFFFF',
    ink: isDark ? '#FFF5F8' : '#25171D',
    text: isDark ? '#D8C6CE' : '#5F4A52',
    muted: isDark ? '#A8959D' : '#9B8790',
    line: isDark ? '#3D3036' : '#EEDBD7',
    tab: isDark ? '#171115' : '#FFFDFB',
    success: isDark ? '#A6D7A6' : '#6C996A',
    warning: isDark ? '#E8CF7E' : '#B9892E',
    danger: isDark ? '#FF8F9A' : '#B23A48',
  };
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('rose');

  const effectiveDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const palette = useMemo(() => buildPalette(effectiveDark, accentColor), [effectiveDark, accentColor]);

  const refreshTheme = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setModeState('system');
        setAccentColorState('rose');
        applyNativeMode('system');
        return;
      }

      const settings = await getMyPrivacySettings();

      const nextMode = (settings.appearance_mode ?? 'system') as AppearanceMode;
      const nextAccent = (settings.accent_color ?? 'rose') as AccentColor;

      setModeState(nextMode);
      setAccentColorState(nextAccent);
      applyNativeMode(nextMode);
    } catch (error) {
      console.log('Theme refresh skipped:', error);
    }
  }, []);

  useEffect(() => {
    refreshTheme();
  }, [refreshTheme]);

  async function setMode(nextMode: AppearanceMode) {
    setModeState(nextMode);
    applyNativeMode(nextMode);

    try {
      await updateMyPrivacySettings({
        appearance_mode: nextMode,
      });
    } catch (error) {
      console.log('Theme mode save failed:', error);
    }
  }

  async function setAccentColor(nextAccent: AccentColor) {
    setAccentColorState(nextAccent);

    try {
      await updateMyPrivacySettings({
        accent_color: nextAccent,
      });
    } catch (error) {
      console.log('Accent color save failed:', error);
    }
  }

  const value = useMemo(
    () => ({
      mode,
      accentColor,
      palette,
      refreshTheme,
      setMode,
      setAccentColor,
    }),
    [mode, accentColor, palette, refreshTheme]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }

  return value;
}
