import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, User, Database, Trash2, Mail, Info, Eye, Image as ImageIcon, Heart } from 'lucide-react-native';
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
  text: '#111111',
  sub: '#666666',
  muted: '#999999',
  shadow: '#000000',
  border: '#E8E8E8',
};

function PolicySection({ icon: Icon, title, content }: { icon: any, title: string, content: string }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconContainer}>
          <Icon size={20} color={C.text} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

export function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: getTabBarReservedHeight(insets.bottom) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <Text style={styles.lastUpdated}>Last updated: June 29, 2026</Text>
          <Text style={styles.introText}>
            Your privacy matters to us. Introvert App helps you build social confidence through daily dares, levels, stages, points, and progress tracking. This policy explains what we collect and how we use it.
          </Text>
        </View>

        <PolicySection 
          icon={Database} 
          title="1. Information We Collect" 
          content="We may collect your name, email, profile picture, age or date of birth, gender, life category, current level, current stage, completed dares, total points, badges, and task completion time." 
        />
        
        <PolicySection 
          icon={Eye} 
          title="2. How We Use Your Information" 
          content="We use your information to create your profile, show your daily dare, track your progress, personalize your experience, save completed challenges, and improve the app." 
        />

        <PolicySection 
          icon={ImageIcon} 
          title="3. Profile Photo" 
          content="Your profile photo is used to personalize your profile and completion poster. You control whether you share any generated post outside the app." 
        />

        <PolicySection 
          icon={Heart} 
          title="4. Age and Safety" 
          content="Introvert App is designed for users who meet the required age limit. We care about your safety while performing social dares. Never complete a dare that feels unsafe, disrespectful, or uncomfortable." 
        />

        <PolicySection 
          icon={Shield} 
          title="5. Data Storage" 
          content="Your data may be stored securely using third-party services such as authentication, database, storage, and hosting providers. We take reasonable steps to protect your information." 
        />

        <PolicySection 
          icon={User} 
          title="6. Sharing Information" 
          content="We do not sell your personal information. We may only share limited data with trusted services needed to run the app, or when required by law." 
        />

        <PolicySection 
          icon={Info} 
          title="7. Your Choices" 
          content="You can request to access, update, or delete your personal information by contacting support." 
        />

        <PolicySection 
          icon={Trash2} 
          title="8. Delete Account" 
          content="You can request account deletion. When deleted, your profile, progress, points, badges, completed dares, and uploaded profile image may be removed or anonymized." 
        />

        <PolicySection 
          icon={Mail} 
          title="9. Contact Us" 
          content={"For privacy questions or data deletion requests, contact:\nsupport@introvertapp.com"} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 16 
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: { 
    color: '#1B1B3A', 
    fontSize: 18, 
    fontFamily: displayFont, 
    fontWeight: '700' 
  },
  headerRight: {
    width: 40,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 8,
  },
  topInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: displayFont,
    fontWeight: '600',
    color: C.sub,
    marginBottom: 16,
  },
  introText: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.sub,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1B1B3A',
    flex: 1,
  },
  sectionContent: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.sub,
    lineHeight: 22,
  }
});
