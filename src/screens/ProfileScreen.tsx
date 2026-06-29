import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, User, Lock, Bell, Globe, Info, Palette, Calendar, HelpCircle, Shield, FileText, LogOut, Edit3, Camera, X, Trophy, Flame, Target, Settings } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import type { Profile } from '../types/profile';
import { LIFE_CATEGORIES, LifeCategory, genderOptions } from '../constants/lifeCategories';

function EditProfileModal({ visible, onClose, profile, onSave }: { visible: boolean; onClose: () => void; profile: Profile; onSave: (data: Partial<Profile> & { avatar_uri?: string }) => Promise<void> }) {
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState(profile.gender);
  const [lifeCategory, setLifeCategory] = useState<LifeCategory | ''>((profile.life_category as LifeCategory) ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'gender' | 'role' | null>(null);

  const insets = useSafeAreaInsets();

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!name.trim() || !gender.trim() || !lifeCategory.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        gender: gender.trim(),
        life_category: lifeCategory as LifeCategory,
        avatar_uri: avatarUri || undefined
      });
      Alert.alert('Success', 'Profile updated successfully.');
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  }

  const currentImage = avatarUri || profile.avatar_url;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : 20 }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.imageEditContainer}>
            <TouchableOpacity style={styles.imageEditWrapper} onPress={handlePickImage}>
              {currentImage ? (
                <Image source={{ uri: currentImage }} style={styles.editAvatarImage} />
              ) : (
                <View style={styles.editAvatarPlaceholder}>
                  <Text style={styles.editAvatarInitials}>{name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Camera size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.muted} placeholder="Your name" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TouchableOpacity style={styles.dropdownField} onPress={() => setOpenDropdown('gender')}>
              <Text style={[styles.dropdownText, !gender && styles.placeholderText]}>{gender || 'Select gender'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Life Category</Text>
            <TouchableOpacity style={styles.dropdownField} onPress={() => setOpenDropdown('role')}>
              <Text style={[styles.dropdownText, !lifeCategory && styles.placeholderText]}>{lifeCategory || 'Select your vibe / role'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={openDropdown !== null} transparent animationType="fade" onRequestClose={() => setOpenDropdown(null)}>
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setOpenDropdown(null)}>
          <TouchableOpacity style={styles.dropdownMenu} activeOpacity={1}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(openDropdown === 'gender' ? genderOptions : LIFE_CATEGORIES).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownOption}
                  onPress={() => {
                    if (openDropdown === 'gender') setGender(option);
                    if (openDropdown === 'role') setLifeCategory(option as LifeCategory);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}



function StatBlock({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <View style={styles.statBlock}>
      <View style={styles.statIconContainer}>
        <Icon size={24} color={C.text} />
      </View>
      <Text style={styles.statBlockValue}>{value}</Text>
      <Text style={styles.statBlockLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon: Icon, label, value, onPress, isLast }: { icon: any; label: string; value?: string | number; onPress?: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress} disabled={!onPress}>
      <View style={styles.menuItemLeft}>
        <Icon size={20} color={C.text} />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value ? <Text style={styles.menuItemValue}>{value}</Text> : null}
        {onPress ? <ChevronRight size={20} color={C.muted} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [editModalVisible, setEditModalVisible] = useState(false);

  if (!profile) return null;

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Could not log out', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const userEmail = user?.email || 'No email available';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setEditModalVisible(true)}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImageLarge} />
            ) : (
              <View style={styles.avatarPlaceholderLarge}>
                <Text style={styles.avatarInitialsLarge}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Edit3 size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileNameCentered}>{profile.name}</Text>
          <Text style={styles.profileEmailCentered}>{userEmail}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatBlock icon={Trophy} value={profile.total_points} label="Total Points" />
          <StatBlock icon={Flame} value={profile.current_level} label="Current Level" />
          <StatBlock icon={Target} value={profile.current_stage} label="Current Stage" />
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon={User} label="Age" value={profile.age} />
          <MenuItem icon={Info} label="Gender" value={profile.gender} />
          <MenuItem icon={Globe} label="Life Category" value={profile.life_category} />
          <MenuItem icon={Settings} label="Settings" onPress={() => navigation.navigate('Settings')} isLast />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={profile}
        onSave={async (data) => {
          if (user?.id) {
            await updateProfile(user.id, data);
          }
        }}
      />
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  headerTitle: { color: '#1B1B3A', fontSize: 18, fontFamily: displayFont, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.border,
  },
  avatarPlaceholderLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsLarge: {
    fontSize: 36,
    fontFamily: displayFont,
    fontWeight: '700',
    color: C.text,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  profileNameCentered: {
    fontSize: 24,
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: 4,
  },
  profileEmailCentered: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.muted,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBlockValue: {
    fontSize: 18,
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: 4,
  },
  statBlockLabel: {
    fontSize: 13,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.muted,
  },

  menuCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
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
  menuItemValue: {
    marginRight: 8,
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.sub,
  },

  logoutButton: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(216, 91, 80, 0.3)',
    marginBottom: 20,
  },
  logoutText: { fontSize: 16, fontFamily: displayFont, fontWeight: '700', color: colors.danger },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: C.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  modalTitle: { fontSize: 24, fontFamily: displayFont, fontWeight: '800', color: C.text },
  closeButton: { padding: 8, backgroundColor: C.border, borderRadius: 20 },
  modalContent: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  imageEditContainer: { alignItems: 'center', marginVertical: 24 },
  imageEditWrapper: { position: 'relative' },
  editAvatarImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.border },
  editAvatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  editAvatarInitials: { fontSize: 40, fontFamily: displayFont, fontWeight: '800', color: C.text },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: C.text,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.bg
  },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontFamily: displayFont, fontWeight: '600', color: C.text, marginBottom: 8, paddingLeft: 4 },
  input: {
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.text,
    borderWidth: 1,
    borderColor: C.border
  },
  
  dropdownField: {
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.text,
  },
  placeholderText: {
    color: C.muted
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30
  },
  dropdownMenu: {
    width: '100%',
    maxHeight: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  dropdownOption: {
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE'
  },
  dropdownOptionText: {
    color: C.text,
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '500'
  },
  
  modalFooter: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  saveButton: { backgroundColor: C.text, borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: C.white, fontSize: 16, fontFamily: displayFont, fontWeight: '700' }
});
