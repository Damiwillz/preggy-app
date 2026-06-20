import { Appearance } from 'react-native';

import { getMyPrivacySettings, type PrivacySettings } from '@/services/privacy';

type ColorScheme = 'light' | 'dark' | null;

function setNativeColorScheme(scheme: ColorScheme) {
  const nativeAppearance = Appearance as typeof Appearance & {
    setColorScheme?: (scheme: ColorScheme) => void;
  };

  nativeAppearance.setColorScheme?.(scheme);
}

export function applyAppearanceMode(mode?: PrivacySettings['appearance_mode'] | null) {
  if (mode === 'dark') {
    setNativeColorScheme('dark');
    return;
  }

  if (mode === 'light') {
    setNativeColorScheme('light');
    return;
  }

  setNativeColorScheme(null);
}

export async function applySavedAppearanceFromAccount() {
  try {
    const settings = await getMyPrivacySettings();

    applyAppearanceMode(settings.appearance_mode);

    return settings;
  } catch (error) {
    console.log('Could not apply saved appearance:', error);

    return null;
  }
}
