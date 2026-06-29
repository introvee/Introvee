import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';

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
  primary: '#111111'
};

export function AboutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>IA</Text>
            </View>
            <Text style={styles.appName}>Introvert App</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
          
          <Text style={styles.description}>
            The Introvert App is designed to help you take small, brave steps in your daily life. Build your confidence through daily dares and track your journey at your own pace.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.footerText}>
            Designed with care for quiet courage.
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
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: C.white,
    fontSize: 32,
    fontFamily: displayFont,
    fontWeight: '800',
  },
  appName: {
    fontSize: 22,
    fontFamily: displayFont,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.muted,
  },
  description: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '400',
    color: C.text,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: C.border,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.muted,
    textAlign: 'center',
  },
});
