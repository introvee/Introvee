import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/Card';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { getJournal } from '../services/dareService';
import { useAuthStore } from '../store/useAuthStore';
import type { UserDareLog } from '../types/dare';

export function JournalScreen() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<UserDareLog[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        if (!user) return;
        setLoading(true);
        try {
          const logs = await getJournal(user.id);
          if (active) setItems(logs);
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Journal</Text>
      {loading ? <ActivityIndicator color={colors.green} /> : null}
      {!loading && items.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No journal entries yet</Text>
          <Text style={styles.muted}>Complete or skip a dare and it will appear here.</Text>
        </Card>
      ) : null}
      {items.map((item) => (
        <Card key={item.id} style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            <Text style={[styles.status, item.status === 'skipped' ? styles.skipped : styles.completed]}>{item.status}</Text>
          </View>
          <Text style={styles.itemTitle}>{item.dares?.title ?? 'Introvee dare'}</Text>
          {item.reflection ? <Text style={styles.muted}>{item.reflection}</Text> : null}
          <Text style={styles.points}>+{item.points_earned} points</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 14, paddingBottom: 110 },
  title: { color: colors.text, fontSize: 32, lineHeight: 38, fontFamily: fonts.bold },
  item: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  date: { color: colors.muted, fontFamily: fonts.bold },
  status: { fontFamily: fonts.bold },
  completed: { color: colors.card, backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  skipped: { color: colors.muted },
  itemTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.bold, lineHeight: 24 },
  points: { color: colors.text, fontFamily: fonts.bold },
  emptyTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.bold, marginBottom: 6 },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22, fontFamily: fonts.regular }
});
