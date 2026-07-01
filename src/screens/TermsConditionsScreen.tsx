import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getTabBarReservedHeight } from '../constants/layout';

const displayFont = Platform.select({
  ios: 'SF Pro Display',
  android: 'sans-serif',
  default: '"Inter", "SF Pro Display", "Satoshi", "Helvetica Neue", Arial, sans-serif'
});

const C = {
  bg: '#F5F5F3',
  white: '#FFFFFF',
  text: '#1B1B3A',
  muted: '#8A8A8E',
  border: '#E8E8E8',
  shadow: '#000000',
};

export function TermsConditionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: getTabBarReservedHeight(insets.bottom) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Welcome to Introvee. By using this application, you agree to these Terms & Conditions.
          </Text>
          <Text style={styles.paragraph}>
            1. You must be at least 16 years old to use this app.
          </Text>
          <Text style={styles.paragraph}>
            2. You are responsible for maintaining the confidentiality of your account.
          </Text>
          <Text style={styles.paragraph}>
            3. The content provided in this app is for personal growth and educational purposes.
          </Text>
          <Text style={styles.paragraph}>
            4. We reserve the right to modify or terminate the service for any reason, without notice at any time.
          </Text>
          <Text style={styles.paragraph}>
            (This is a placeholder for the full Terms & Conditions)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: displayFont,
    fontWeight: '700',
    color: C.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '400',
    color: C.text,
    lineHeight: 24,
    marginBottom: 16,
  },
});
