import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, Image, MessageCircle, MoreHorizontal, Sparkles } from 'lucide-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareWin'>;

export function ShareWinScreen({ navigation, route }: Props) {
  const [caption, setCaption] = useState('');
  const { dare, pointsEarned } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share win</Text>
      <Card style={styles.winCard}>
        <Text style={styles.cardTitle}>I completed an Introvee dare</Text>
        <Text style={styles.dare}>{dare.title}</Text>
        <Text style={styles.points}>+{pointsEarned} points</Text>
      </Card>
      <Button title="Add Photo" variant="secondary" icon={<Camera color={colors.text} size={20} />} onPress={() => Alert.alert('Photo upload', 'Photo upload is a UI placeholder in this MVP.')} />
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Optional caption"
        placeholderTextColor={colors.muted}
        multiline
        style={styles.caption}
      />
      <View style={styles.shareGrid}>
        <ShareChip label="Instagram" icon={<Image color="#E87800" size={20} />} />
        <ShareChip label="WhatsApp" icon={<MessageCircle color={colors.green} size={20} />} />
        <ShareChip label="Stories" icon={<Sparkles color={colors.green} size={20} />} />
        <ShareChip label="More" icon={<MoreHorizontal color={colors.text} size={20} />} />
      </View>
      <View style={styles.actions}>
        <Button title="Share My Win" onPress={() => Alert.alert('Share ready', 'Native sharing can be connected in the next build.')} />
        <Button title="Maybe later" variant="ghost" onPress={() => navigation.navigate('Main')} />
      </View>
    </View>
  );
}

function ShareChip({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <View style={styles.chip}>
      {icon}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 56, gap: 16 },
  title: { color: colors.text, fontSize: 32, lineHeight: 38, fontFamily: fonts.bold },
  winCard: { gap: 10 },
  cardTitle: { color: colors.green, fontFamily: fonts.bold, fontSize: 14 },
  dare: { color: colors.text, fontSize: 21, lineHeight: 28, fontFamily: fonts.bold },
  points: { color: colors.green, fontFamily: fonts.bold },
  caption: {
    minHeight: 96,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: 16,
    textAlignVertical: 'top'
  },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
    alignItems: 'center'
  },
  chipText: { color: colors.text, fontFamily: fonts.bold },
  actions: { gap: 12, marginTop: 'auto', paddingBottom: 18 }
});
