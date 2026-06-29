import AsyncStorage from '@react-native-async-storage/async-storage';

const completionSnapshotPrefix = 'bravestep:dare-completion:';

export type CompletionSnapshot = {
  userId: string;
  dareId: string;
  status: 'completed' | 'easier_completed';
  completedDurationSeconds: number;
  completedAt: string;
  level: number;
  stage: number;
  day: number;
};

export async function saveCompletionSnapshot(snapshot: CompletionSnapshot) {
  const key = `${completionSnapshotPrefix}${snapshot.userId}:${snapshot.dareId}:${snapshot.completedAt.slice(0, 10)}`;
  await AsyncStorage.setItem(key, JSON.stringify(snapshot));
}
