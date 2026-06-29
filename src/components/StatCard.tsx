import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  value: { color: colors.text, fontSize: 22, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 13, marginTop: 4 }
});
