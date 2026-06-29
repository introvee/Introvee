import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/fonts';
import { Flame, Star } from 'lucide-react-native';

interface PremiumRewardCardProps {
  basePoints: number;
  timingBonus: number;
  levelBonus?: number;
  shareBonusAdded?: boolean;
  totalPoints: number;
  streakCount: number;
}

export function PremiumRewardCard({
  basePoints,
  timingBonus,
  levelBonus = 0,
  shareBonusAdded = false,
  totalPoints,
  streakCount
}: PremiumRewardCardProps) {
  const pointsEarnedToday = basePoints + timingBonus + levelBonus + (shareBonusAdded ? 25 : 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Star size={18} color="#000" fill="#000" />
        </View>
        <Text style={styles.title}>Reward Summary</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Points Earned Today</Text>
        <Text style={styles.value}>+{pointsEarnedToday}</Text>
      </View>

      {timingBonus > 0 && (
        <View style={styles.subRow}>
          <Text style={styles.subLabel}>└ Timing Bonus</Text>
          <Text style={styles.subValue}>+{timingBonus}</Text>
        </View>
      )}

      {levelBonus > 0 && (
        <View style={styles.subRow}>
          <Text style={[styles.subLabel, { color: '#008A27' }]}>└ Level Bonus</Text>
          <Text style={[styles.subValue, { color: '#008A27' }]}>+{levelBonus}</Text>
        </View>
      )}

      {shareBonusAdded && (
        <View style={styles.subRow}>
          <Text style={[styles.subLabel, { color: '#008A27' }]}>└ Share Bonus</Text>
          <Text style={[styles.subValue, { color: '#008A27' }]}>+25</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Total XP</Text>
        <Text style={styles.valueTotal}>{totalPoints}</Text>
      </View>

      {streakCount > 0 && (
        <View style={styles.streakBox}>
          <Flame size={16} color="#008A27" />
          <Text style={styles.streakText}>{streakCount} Day Streak Active!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16
  },
  iconWrap: {
    backgroundColor: '#00FF41',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#008A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#111111'
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#666666'
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#111111'
  },
  valueTotal: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#111111'
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    marginBottom: 8
  },
  subLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#999999'
  },
  subValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#666666'
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 12
  },
  streakText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#008A27'
  }
});
