import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

export function ProgressDots({ stage }: { stage: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {[1, 2, 3, 4, 5].map((dot) => (
        <View key={dot} style={[styles.dot, dot <= stage && styles.active, dot === stage && styles.current]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, alignItems: 'center', justifyContent: 'center', position: 'relative', height: 24 },
  line: { position: 'absolute', width: 164, height: 2, backgroundColor: colors.border, borderRadius: 999 },
  dot: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.card, borderWidth: 2, borderColor: '#C7C0B6' },
  active: { backgroundColor: colors.green, borderColor: colors.green },
  current: { width: 22, height: 22, borderRadius: 11, borderWidth: 5, borderColor: colors.green, backgroundColor: colors.background }
});
