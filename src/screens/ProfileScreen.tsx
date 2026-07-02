import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, User, Lock, Bell, Globe, Info, Palette, Calendar, HelpCircle, Shield, FileText, LogOut, Edit3, Camera, X, Trophy, Flame, Target, Settings } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { getBottomSafeSpace, getTabBarBottomOffset, TAB_BAR_BASE_HEIGHT } from '../constants/layout';
import { clamp, getResponsivePageMetrics } from '../constants/responsive';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import type { Profile } from '../types/profile';

function EditProfileModal({ visible, onClose, profile, onSave }: { visible: boolean; onClose: () => void; profile: Profile; onSave: (data: Partial<Profile> & { avatar_uri?: string }) => Promise<void> }) {
  const [name, setName] = useState(profile.name);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    setName(profile.name);
    setAvatarUri(null);
  }, [profile.name, visible]);

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
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please add your name.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
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
        </ScrollView>

        <View style={[styles.modalFooter, { paddingBottom: getBottomSafeSpace(insets.bottom) + 20 }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </View>

    </Modal>
  );
}



function StatBlock({ icon: Icon, value, label, compact }: { icon: any; value: string | number; label: string; compact: boolean }) {
  return (
    <View style={styles.statBlock}>
      <View style={[styles.statIconContainer, compact && styles.statIconContainerCompact]}>
        <Icon size={compact ? 20 : 24} color={C.text} />
      </View>
      <Text style={[styles.statBlockValue, compact && styles.statBlockValueCompact]}>{value}</Text>
      <Text style={[styles.statBlockLabel, compact && styles.statBlockLabelCompact]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

function MenuItem({ icon: Icon, label, value, onPress, isLast, compact }: { icon: any; label: string; value?: string | number; onPress?: () => void; isLast?: boolean; compact: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuItem, compact && styles.menuItemCompact, !isLast && styles.menuItemBorder]} onPress={onPress} disabled={!onPress}>
      <View style={styles.menuItemLeft}>
        <Icon size={compact ? 18 : 20} color={C.text} />
        <Text style={[styles.menuItemLabel, compact && styles.menuItemLabelCompact]} numberOfLines={1}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value ? <Text style={[styles.menuItemValue, compact && styles.menuItemValueCompact]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text> : null}
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
  const { width, height } = useWindowDimensions();
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
  const metrics = getResponsivePageMetrics(width, height);
  const compact = height < 840 || width < 390;
  const veryCompact = height < 760;
  const tabReserve = TAB_BAR_BASE_HEIGHT + getTabBarBottomOffset(insets.bottom) + 10;
  const avatarSize = compact ? (veryCompact ? 74 : 84) : 100;
  const logoutButtonWidth = Math.min(width - metrics.horizontalPadding * 2, metrics.maxWidth);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingVertical: compact ? 8 : 16 }]}>
        <Text style={[styles.headerTitle, { fontSize: compact ? 17 : 18 }]}>Profile</Text>
      </View>

      <ScrollView
        scrollEnabled={veryCompact}
        bounces={veryCompact}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: metrics.horizontalPadding,
            paddingTop: compact ? 2 : 8,
            paddingBottom: tabReserve,
            maxWidth: metrics.maxWidth,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileSection, { marginBottom: compact ? 16 : 32 }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setEditModalVisible(true)}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={[styles.avatarImageLarge, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
            ) : (
              <View style={[styles.avatarPlaceholderLarge, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Text style={[styles.avatarInitialsLarge, { fontSize: compact ? 30 : 36 }]}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.editIconBadge, compact && styles.editIconBadgeCompact]}>
              <Edit3 size={compact ? 12 : 14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileNameCentered, compact && styles.profileNameCompact]} numberOfLines={1} adjustsFontSizeToFit>{profile.name}</Text>
          <Text style={[styles.profileEmailCentered, compact && styles.profileEmailCompact]} numberOfLines={1} adjustsFontSizeToFit>{userEmail}</Text>
        </View>

        <View style={[styles.statsRow, { marginBottom: compact ? 16 : 32 }]}>
          <StatBlock icon={Trophy} value={profile.total_points} label="Total Points" compact={compact} />
          <StatBlock icon={Flame} value={profile.current_level} label="Current Level" compact={compact} />
          <StatBlock icon={Target} value={profile.current_stage} label="Current Stage" compact={compact} />
        </View>

        <View style={[styles.menuCard, { borderRadius: compact ? 20 : 24, paddingHorizontal: compact ? 16 : 20, paddingVertical: compact ? 4 : 8 }]}>
          <MenuItem icon={User} label="Age" value={profile.age} compact={compact} />
          <MenuItem icon={Info} label="Gender" value={profile.gender} compact={compact} />
          <MenuItem icon={Globe} label="Life Category" value={profile.life_category} compact={compact} />
          <MenuItem icon={Settings} label="Settings" onPress={() => navigation.navigate('Settings')} isLast compact={compact} />
        </View>

      </ScrollView>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={[
          styles.logoutButton,
          styles.logoutFixedButton,
          {
            width: logoutButtonWidth,
            bottom: tabReserve + 10,
          },
        ]}
        onPress={handleLogout}
      >
        <LogOut size={compact ? 17 : 20} color={colors.danger} />
        <Text style={[styles.logoutText, compact && styles.logoutTextCompact]}>Logout</Text>
      </TouchableOpacity>

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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100, width: '100%', alignSelf: 'center' },
  
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
  editIconBadgeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  profileNameCentered: {
    fontSize: 24,
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: 4,
  },
  profileNameCompact: {
    fontSize: 21,
    marginBottom: 2,
  },
  profileEmailCentered: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.muted,
  },
  profileEmailCompact: {
    fontSize: 13,
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
  statIconContainerCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 8,
  },
  statBlockValue: {
    fontSize: 18,
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: 4,
  },
  statBlockValueCompact: {
    fontSize: 16,
    marginBottom: 2,
  },
  statBlockLabel: {
    fontSize: 13,
    fontFamily: displayFont,
    fontWeight: '500',
    color: C.muted,
  },
  statBlockLabelCompact: {
    fontSize: 11.5,
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
  menuItemCompact: {
    paddingVertical: 11,
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
  menuItemLabelCompact: {
    marginLeft: 12,
    fontSize: 14,
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
  menuItemValueCompact: {
    fontSize: 13.5,
    maxWidth: 150,
  },

  logoutButton: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(216, 91, 80, 0.3)',
  },
  logoutFixedButton: {
    position: 'absolute',
    alignSelf: 'center',
    minHeight: 44,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  logoutText: { fontSize: 16, fontFamily: displayFont, fontWeight: '700', color: colors.danger },
  logoutTextCompact: { fontSize: 14 },

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
