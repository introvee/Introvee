import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, ChevronDown, Shield, Mail, HelpCircle } from 'lucide-react-native';
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
  dark: '#1C1C1E',
  text: '#111111',
  sub: '#666666',
  muted: '#999999',
  shadow: '#000000',
  border: '#E8E8E8',
};

function FAQItem({ question, answer, isLast }: { question: string, answer: string, isLast?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={!isLast ? styles.faqItem : null}>
      <TouchableOpacity style={styles.faqHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {expanded ? <ChevronDown size={20} color={C.muted} /> : <ChevronRight size={20} color={C.muted} />}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

function MenuItem({ icon: Icon, label, onPress, isLast }: { icon: any; label: string; onPress?: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon size={20} color={C.text} />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        <ChevronRight size={20} color={C.muted} />
      </View>
    </TouchableOpacity>
  );
}

export function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleEmailSupport = (subject: string) => {
    Linking.openURL(`mailto:support@introvertapp.com?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help / Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: getTabBarReservedHeight(insets.bottom) }]} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HelpCircle size={20} color={C.text} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>How can we help you?</Text>
          </View>
          <Text style={styles.cardBody}>
            Find answers, report an issue, or contact our support team. We're here to make your 100-day confidence journey smooth and safe.
          </Text>
        </View>



        {/* FAQ Section */}
        <View style={styles.cardNoPadding}>
          <FAQItem 
            question="How does Introvert App work?"
            answer="Introvert App gives you one social confidence dare each day. There are 20 levels, and each level has 5 stages. Complete all 100 stages to finish your 100-day journey."
          />
          <FAQItem 
            question="Why is my next stage locked?"
            answer="Upcoming stages stay locked until you complete your current dare. Once today's dare is completed, the next stage will unlock based on your progress."
          />
          <FAQItem 
            question="Can I skip a dare?"
            answer="If a dare feels unsafe, uncomfortable, or not suitable for your situation, do not perform it. Your safety comes first."
          />
          <FAQItem 
            question="Why are points not updated?"
            answer="Points are updated after a dare is completed. If points do not update immediately, refresh the app or check your internet connection."
          />
          <FAQItem 
            question="Can I change my profile details?"
            answer="Yes. You can edit your name, profile picture, age, gender, and life category from your Profile page if editing is enabled."
          />
          <FAQItem 
            question="Is my profile photo shared automatically?"
            answer="No. Your profile photo is only used inside the app and on your completion poster. You decide whether to share the poster outside the app."
            isLast
          />
        </View>

        {/* Safety Reminder Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={20} color={C.text} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Your safety comes first</Text>
          </View>
          <Text style={styles.cardBody}>
            Never complete a dare that feels unsafe, disrespectful, illegal, or uncomfortable. Choose confidence, not pressure.
          </Text>
        </View>

        {/* Contact Support Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Still need help?</Text>
          <Text style={styles.cardBody}>
            Contact our support team and we'll help you as soon as possible.
          </Text>
          <View style={styles.emailRow}>
            <Mail size={16} color={C.sub} />
            <Text style={styles.emailText}>support@introvertapp.com</Text>
          </View>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleEmailSupport('Introvert App Support Request')}
          >
            <Text style={styles.primaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Report Issue Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Report a problem</Text>
          <Text style={styles.cardBody}>
            Found a bug or something not working correctly? Send us a short message with what happened.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleEmailSupport('Introvert App Issue Report')}
          >
            <Text style={styles.primaryButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

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
  card: {
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
  cardNoPadding: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.sub,
    lineHeight: 22,
  },
  
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    marginLeft: 16,
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '600',
    color: '#1B1B3A',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '600',
    color: '#1B1B3A',
    flex: 1,
    paddingRight: 16,
  },
  faqBody: {
    paddingBottom: 16,
    paddingRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.sub,
    lineHeight: 20,
  },
  
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 12,
  },
  emailText: {
    marginLeft: 8,
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '600',
    color: C.text,
  },
  
  primaryButton: {
    backgroundColor: C.dark,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 12,
  },
  primaryButtonText: {
    color: C.white,
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '700',
  }
});
