import { useState } from 'react';
import * as Localization from 'expo-localization';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/fonts';
import { getBottomSafeSpace } from '../constants/layout';
import { clamp, getResponsivePageMetrics } from '../constants/responsive';

const C = {
  white: '#FFFFFF',
  text: '#111111',
  sub: '#666666',
  muted: '#999999',
  border: '#E8E8E8',
  shadow: '#000000',
};

const UPI_ID = '9962046078-2@axl';
const PAYPAL_EMAIL = 'karthickvaanam94@gmail.com';
const localizationWithLegacyRegion = Localization as typeof Localization & { region?: string };
const INDIA_TIME_ZONES = new Set(['Asia/Kolkata', 'Asia/Calcutta']);

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DonationModal({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const metrics = getResponsivePageMetrics(width, height);
  const modalPadding = clamp(width * 0.055, 18, 22);
  const bottomSpace = getBottomSafeSpace(insets.bottom);

  const [countryCode] = useState(getDonationCountryCode);

  const isIndia = countryCode === 'IN';
  const donationCurrency = isIndia ? 'INR' : 'USD';
  const currencySymbol = isIndia ? '₹' : '$';
  const donationOptions = isIndia ? ['10', '20', '30', 'custom'] : ['1', '3', '5', 'custom'];

  const handleDonationOptionPress = (amount: string) => {
    setSelectedAmount(amount);
    if (amount !== 'custom') {
      setCustomAmount('');
    }
  };

  const handleDonate = async () => {
    const amount = selectedAmount === 'custom' ? customAmount.trim() : selectedAmount;
    const numericAmount = Number(amount);

    if (!selectedAmount) {
      Alert.alert(isIndia ? 'Donation amount' : 'Support amount', 'Please select an amount');
      return;
    }

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount');
      return;
    }

    if (isIndia) {
      try {
        const payeeName = encodeURIComponent('Introvee');
        const transactionNote = encodeURIComponent('Introvee Support');
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${payeeName}&tn=${transactionNote}&am=${numericAmount}&cu=INR`;
        await Linking.openURL(upiUrl);
        onClose();
      } catch (error) {
        Alert.alert('UPI app not found', 'No UPI app found on this device, or UPI payments are not available right now.');
      }
    } else {
      try {
        const itemName = encodeURIComponent('Introvee Support');
        const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=${itemName}&amount=${numericAmount}&currency_code=USD`;
        await Linking.openURL(paypalUrl);
        onClose();
      } catch (error) {
        Alert.alert('Payment error', 'PayPal payment is not available right now. Please try again later or contact support.');
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.modalOverlay,
          {
            paddingHorizontal: metrics.horizontalPadding,
            paddingTop: insets.top + 16,
            paddingBottom: bottomSpace + 16,
          },
        ]}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalCard, { maxWidth: metrics.maxWidth, maxHeight: Math.max(280, height - insets.top - bottomSpace - 32) }]}>
          <ScrollView
            contentContainerStyle={{ padding: modalPadding, paddingTop: modalPadding + 2 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <Text style={[styles.modalTitle, { fontSize: clamp(metrics.headerTitleSize + 1, 19, 22) }]}>
            {isIndia ? 'Choose Donation' : 'Support Introvee'}
          </Text>
          <Text style={[styles.modalSubtitle, { fontSize: metrics.smallSize }]}>
            Donations are optional and do not unlock any app features or content.
          </Text>

          <View style={styles.amountGrid}>
            {donationOptions.map((option) => {
              const isSelected = selectedAmount === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => handleDonationOptionPress(option)}
                  style={({ pressed }) => [
                    styles.amountOption,
                    isSelected && styles.amountOptionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.amountText, isSelected && styles.amountTextSelected]}>
                    {option === 'custom' ? 'Custom' : `${currencySymbol}${option}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedAmount === 'custom' && (
            <TextInput
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder={`Enter amount in ${donationCurrency}`}
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              style={styles.customAmountInput}
            />
          )}

          <Pressable
            accessibilityRole="button"
            onPress={handleDonate}
            style={({ pressed }) => [styles.donateNowButton, pressed && styles.pressed]}
          >
            <Text style={styles.donateNowButtonText}>Support</Text>
          </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  modalCard: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 22,
    shadowColor: C.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalTitle: {
    color: C.text,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    color: C.sub,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountOption: {
    width: '47%',
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  amountOptionSelected: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  amountText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  amountTextSelected: {
    color: C.white,
  },
  customAmountInput: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  donateNowButton: {
    backgroundColor: C.text,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 20,
    shadowColor: C.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  donateNowButtonText: {
    color: C.white,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});

function getDonationCountryCode() {
  const locales = Localization.getLocales?.() ?? [];
  const calendars = Localization.getCalendars?.() ?? [];
  const regionCode = localizationWithLegacyRegion.region || locales[0]?.regionCode || locales[0]?.languageRegionCode;
  const currencyCode = locales[0]?.currencyCode || locales[0]?.languageCurrencyCode;
  const timeZone = calendars[0]?.timeZone;

  if (currencyCode?.toUpperCase() === 'INR') return 'IN';
  if (timeZone && INDIA_TIME_ZONES.has(timeZone)) return 'IN';
  if (regionCode) return regionCode.toUpperCase();

  return 'US';
}
