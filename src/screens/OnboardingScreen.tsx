import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronDown, Pencil } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { copy } from '../constants/copy';
import { fonts } from '../constants/fonts';
import { genderOptions, LIFE_CATEGORIES, LifeCategory } from '../constants/lifeCategories';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';

type DropdownKind = 'gender' | 'role';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 101 }, (_, index) => String(currentYear - 100 + index)).reverse();

export function OnboardingScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const existingProfile = useProfileStore((state) => state.profile);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

  const [name, setName] = useState(existingProfile?.name ?? '');
  const [dob, setDob] = useState(existingProfile?.dob ?? '');
  const [gender, setGender] = useState(existingProfile?.gender ?? '');
  const [lifeCategory, setLifeCategory] = useState<LifeCategory | ''>((existingProfile?.life_category as LifeCategory) ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(existingProfile?.avatar_url ?? null);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKind | null>(null);
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [draftYear, setDraftYear] = useState('');
  const [draftMonth, setDraftMonth] = useState('');
  const [draftDay, setDraftDay] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const age = dob ? calculateAge(dob) : null;
  const isUnderage = age !== null && age < 16;
  const dobDisplay = dob ? formatDob(dob) : '';

  useEffect(() => {
    if (!existingProfile) return;
    setName(existingProfile.name ?? '');
    setDob(existingProfile.dob ?? '');
    setGender(existingProfile.gender ?? '');
    setLifeCategory(existingProfile.life_category ?? '');
    setAvatarUri(existingProfile.avatar_url ?? null);
  }, [existingProfile?.id]);

  const days = useMemo(() => {
    const year = Number(draftYear || currentYear - 16);
    const month = Number(draftMonth || 1);
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, '0'));
  }, [draftMonth, draftYear]);

  async function pickAvatar() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to choose a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.78
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      setSelectedAvatarUri(result.assets[0].uri);
      setAvatarUri(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Could not choose photo', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  function openDobPicker() {
    const fallback = getDefaultDobParts();
    const parts = dob ? splitDob(dob) : fallback;
    setDraftYear(parts.year);
    setDraftMonth(parts.month);
    setDraftDay(parts.day);
    setIsDobOpen(true);
  }

  function confirmDob() {
    const normalizedDay = days.includes(draftDay) ? draftDay : days[days.length - 1];
    setDob(`${draftYear}-${draftMonth}-${normalizedDay}`);
    setDraftDay(normalizedDay);
    setIsDobOpen(false);
  }

  async function submit() {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Name needed', 'Add the name you want Introvee to use.');
      return;
    }
    if (!dob) {
      Alert.alert('Date of birth needed', 'Add your date of birth to continue.');
      return;
    }
    if (isUnderage || age === null) {
      Alert.alert('Safety first', copy.underage);
      return;
    }
    if (!gender) {
      Alert.alert('Gender needed', 'Choose the gender option that feels right for you.');
      return;
    }
    if (!lifeCategory) {
      Alert.alert('Role needed', 'Choose the vibe or role that fits you best.');
      return;
    }

    setIsSaving(true);
    try {
      await completeOnboarding(user.id, {
        name: name.trim(),
        age,
        dob,
        gender,
        life_category: lifeCategory as LifeCategory,
        avatar_uri: selectedAvatarUri,
        avatar_url: existingProfile?.avatar_url ?? null
      });
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            hitSlop={12}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={tokens.text} strokeWidth={1.9} />
          </Pressable>
          <ProgressIndicator />
          <View style={styles.topSpacer} />
        </View>

        <Text style={styles.title}>Let's set up{'\n'}your space</Text>

        <View style={styles.avatarWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose profile image" onPress={pickAvatar} style={styles.avatarCircle}>
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" /> : <OnboardingMascot />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit avatar" onPress={pickAvatar} hitSlop={8} style={styles.editButton}>
            <Pencil size={18} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.form}>
          <FieldLabel>What should we call you?</FieldLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={tokens.placeholder}
            style={styles.input}
            returnKeyType="next"
          />

          <FieldLabel>When were you born?</FieldLabel>
          <Pressable accessibilityRole="button" onPress={openDobPicker} style={styles.dropdownField}>
            <Text style={[styles.dropdownText, !dobDisplay && styles.placeholderText]}>{dobDisplay || 'Date of birth'}</Text>
            <ChevronDown size={18} color={tokens.text} strokeWidth={2} />
          </Pressable>
          {isUnderage && <Text style={styles.warning}>{copy.underage}</Text>}

          <FieldLabel>What's your gender?</FieldLabel>
          <DropdownField value={gender} placeholder="Select gender" onPress={() => setOpenDropdown('gender')} />

          <FieldLabel>What do you do?</FieldLabel>
          <DropdownField value={lifeCategory} placeholder="Select your vibe / role" onPress={() => setOpenDropdown('role')} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={isSaving || isUnderage}
          style={({ pressed }) => [styles.continueButton, (pressed || isSaving || isUnderage) && styles.continueButtonPressed]}
        >
          <Text style={styles.continueText}>{isSaving ? 'Saving...' : 'Continue'}</Text>
        </Pressable>
      </ScrollView>

      <DropdownModal
        visible={openDropdown !== null}
        options={openDropdown === 'gender' ? [...genderOptions] : [...LIFE_CATEGORIES]}
        selectedValue={openDropdown === 'gender' ? gender : lifeCategory}
        onClose={() => setOpenDropdown(null)}
        onSelect={(option) => {
          if (openDropdown === 'gender') setGender(option);
          if (openDropdown === 'role') setLifeCategory(option as LifeCategory);
          setOpenDropdown(null);
        }}
      />

      <Modal visible={isDobOpen} transparent animationType="fade" onRequestClose={() => setIsDobOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsDobOpen(false)}>
          <Pressable style={styles.dateMenu}>
            <Text style={styles.dateTitle}>Date of birth</Text>
            <View style={styles.dateColumns}>
              <PickerColumn values={years} selectedValue={draftYear} onSelect={setDraftYear} />
              <PickerColumn values={monthLabels.map((month, index) => `${String(index + 1).padStart(2, '0')} ${month}`)} selectedValue={`${draftMonth} ${monthLabels[Number(draftMonth || 1) - 1]}`} onSelect={(value) => setDraftMonth(value.slice(0, 2))} />
              <PickerColumn values={days} selectedValue={draftDay} onSelect={setDraftDay} />
            </View>
            <Pressable accessibilityRole="button" onPress={confirmDob} style={styles.dateDoneButton}>
              <Text style={styles.dateDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function DropdownField({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.dropdownField}>
      <Text style={[styles.dropdownText, !value && styles.placeholderText]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <ChevronDown size={18} color={tokens.text} strokeWidth={2} />
    </Pressable>
  );
}

function DropdownModal({
  visible,
  options,
  selectedValue,
  onClose,
  onSelect
}: {
  visible: boolean;
  options: string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (option: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.dropdownMenu}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={[styles.dropdownOption, selectedValue === option && styles.dropdownOptionSelected]}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PickerColumn({ values, selectedValue, onSelect }: { values: string[]; selectedValue: string; onSelect: (value: string) => void }) {
  return (
    <ScrollView style={styles.pickerColumn} contentContainerStyle={styles.pickerColumnContent} showsVerticalScrollIndicator={false}>
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedValue === value }}
          onPress={() => onSelect(value)}
          style={[styles.pickerOption, selectedValue === value && styles.pickerOptionSelected]}
        >
          <Text style={[styles.pickerText, selectedValue === value && styles.pickerTextSelected]}>{value}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function ProgressIndicator() {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLine} />
      {[0, 1, 2, 3].map((dot) => (
        <View key={dot} style={[styles.progressDot, dot === 0 && styles.progressDotActive]} />
      ))}
    </View>
  );
}

function OnboardingMascot() {
  return (
    <Svg width={92} height={92} viewBox="0 0 118 118">
      <Circle cx="59" cy="43" r="33" fill="#FFFEFB" stroke={tokens.text} strokeWidth="2.5" />
      <Circle cx="44" cy="43" r="3.6" fill={tokens.text} />
      <Circle cx="74" cy="43" r="3.6" fill={tokens.text} />
      <Path d="M52 53 Q59 59 66 53" stroke={tokens.text} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Circle cx="34" cy="55" r="4.2" fill="#FFAAA6" opacity="0.8" />
      <Circle cx="84" cy="55" r="4.2" fill="#FFAAA6" opacity="0.8" />
      <Path d="M43 76 Q43 95 38 112" stroke={tokens.text} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M75 76 Q75 95 80 112" stroke={tokens.text} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M51 78 L51 112" stroke={tokens.text} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M67 78 L67 112" stroke={tokens.text} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function getDefaultDobParts() {
  return { year: String(currentYear - 16), month: '01', day: '01' };
}

function splitDob(value: string) {
  const [year, month, day] = value.split('-');
  return { year, month, day };
}

function calculateAge(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasHadBirthday =
    today.getMonth() > date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

function formatDob(value: string) {
  const [year, month, day] = value.split('-');
  const monthIndex = Number(month) - 1;
  if (!year || !day || monthIndex < 0 || monthIndex > 11) return value;
  return `${day} ${monthLabels[monthIndex]} ${year}`;
}

const tokens = {
  background: '#FFFEFB',
  text: '#241516',
  placeholder: '#8F8F8F',
  border: '#DADADA',
  green: '#8FAA8D',
  button: '#2A1414',
  buttonPressed: '#3A1D1D',
  softCircle: '#EFEFEE'
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.background },
  container: { flex: 1, backgroundColor: tokens.background },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 34,
    paddingBottom: 28,
    minHeight: '100%'
  },
  topBar: {
    width: '86%',
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  topSpacer: { width: 30, height: 30 },
  progressWrap: {
    width: 158,
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  progressLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 9,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E3E3E3'
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E2E2'
  },
  progressDotActive: {
    backgroundColor: tokens.green
  },
  title: {
    marginTop: 22,
    color: tokens.text,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontWeight: '400'
  },
  avatarWrap: {
    marginTop: 20,
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: tokens.softCircle,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  editButton: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.button
  },
  form: {
    width: '85%',
    marginTop: 20,
    marginBottom: 20
  },
  label: {
    color: tokens.text,
    fontSize: 15.5,
    lineHeight: 20,
    fontFamily: fonts.regular,
    marginBottom: 8
  },
  input: {
    width: '100%',
    height: 54,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: tokens.border,
    paddingHorizontal: 19,
    color: tokens.text,
    backgroundColor: '#FFFFFF',
    fontSize: 15.5,
    fontFamily: fonts.regular,
    marginBottom: 16
  },
  warning: {
    color: '#9D4B3F',
    backgroundColor: '#FFF2EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    marginTop: -8,
    marginBottom: 16
  },
  dropdownField: {
    width: '100%',
    height: 54,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: tokens.border,
    paddingHorizontal: 19,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  dropdownText: {
    flex: 1,
    color: tokens.text,
    fontSize: 15.5,
    fontFamily: fonts.regular,
    marginRight: 12
  },
  placeholderText: {
    color: tokens.placeholder
  },
  continueButton: {
    width: '85%',
    height: 58,
    borderRadius: 29,
    backgroundColor: tokens.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 0
  },
  continueButtonPressed: {
    backgroundColor: tokens.buttonPressed,
    opacity: 0.82
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontFamily: fonts.bold,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 21, 22, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30
  },
  dropdownMenu: {
    width: '100%',
    maxHeight: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  dropdownOption: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE'
  },
  dropdownOptionSelected: {
    backgroundColor: '#EEF3EC'
  },
  dropdownOptionText: {
    color: tokens.text,
    fontSize: 15.5,
    fontFamily: fonts.regular
  },
  dateMenu: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  dateTitle: {
    color: tokens.text,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.bold,
    marginBottom: 12
  },
  dateColumns: {
    height: 214,
    flexDirection: 'row',
    gap: 8
  },
  pickerColumn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFEFB'
  },
  pickerColumnContent: {
    paddingVertical: 6
  },
  pickerOption: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  pickerOptionSelected: {
    backgroundColor: '#EEF3EC'
  },
  pickerText: {
    color: tokens.text,
    fontSize: 15,
    fontFamily: fonts.regular
  },
  pickerTextSelected: {
    fontFamily: fonts.bold
  },
  dateDoneButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.button,
    marginTop: 14
  },
  dateDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold
  }
});
