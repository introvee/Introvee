import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import type { Dare } from '../types/dare';
import { Card } from './Card';
import { Mascot } from './Mascot';

type Props = {
  dare: Dare;
  easierMode?: boolean;
};

export function DareCard({ dare, easierMode }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.mascotWrap}>
        <Mascot type={dare.mascot_type} level={dare.level} />
      </View>
      <Text style={styles.kicker}>{easierMode ? 'Lighter step' : `Day ${dare.day_number}`}</Text>
      <Text style={styles.title}>{easierMode ? dare.easier_title : dare.title}</Text>
      <Text style={styles.description}>{easierMode ? dare.easier_description : dare.description}</Text>
      <View style={styles.tip}>
        <Text style={styles.tipLabel}>Safety tip</Text>
        <Text style={styles.tipText}>{dare.safety_tip}</Text>
      </View>
      <Text style={styles.points}>+{easierMode ? 10 : dare.points} points</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  mascotWrap: { alignItems: 'center' },
  kicker: { color: colors.primary, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
  title: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  tip: { backgroundColor: colors.softOrange, borderRadius: 12, padding: 14, gap: 4 },
  tipLabel: { color: colors.text, fontWeight: '800', fontSize: 13 },
  tipText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  points: { color: colors.green, fontSize: 16, fontWeight: '800' }
});
