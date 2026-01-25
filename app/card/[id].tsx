import { useLocalSearchParams } from 'expo-router';
import { CardForm } from '@/components/cards';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CardForm cardId={id} />;
}
