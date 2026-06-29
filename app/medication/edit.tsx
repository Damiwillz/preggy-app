import { useLocalSearchParams } from 'expo-router';

import { MedicationFormContent } from '@/components/medication/MedicationFormContent';

export default function EditMedicationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const medicationId = typeof params.id === 'string' ? params.id : null;

  return <MedicationFormContent medicationId={medicationId} />;
}
