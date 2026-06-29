import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Trash2, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';

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
  sub: '#666666',
  border: '#E8E8E8',
  shadow: '#000000',
  danger: '#D85B50',
};

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteChecked, setDeleteChecked] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    setIsDeleting(true);
    try {
      const userId = user.id;

      // Clean up app data
      await supabase.from("user_dare_logs").delete().eq("user_id", userId);
      await supabase.from("user_badges").delete().eq("user_id", userId);
      await supabase.from("user_settings").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);

      // Call edge function to delete auth user
      const { error: invokeError } = await supabase.functions.invoke('delete-user', {
        method: 'POST',
      });

      if (invokeError) {
        console.error("Error invoking delete-user edge function:", invokeError);
        Alert.alert("Notice", "App data deleted, but there was an issue completely removing the account. Please contact support.");
      }

      // Sign out locally
      await logout();
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setDeleteInput('');
      setDeleteChecked(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Section 2: App */}
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.navRow, styles.borderBottom]} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.rowTitle}>Help / Support</Text>
            <ChevronRight size={20} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navRow, styles.borderBottom]} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.rowTitle}>Privacy</Text>
            <ChevronRight size={20} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navRow, styles.borderBottom]} onPress={() => navigation.navigate('TermsConditions')}>
            <Text style={styles.rowTitle}>Terms & Conditions</Text>
            <ChevronRight size={20} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('About')}>
            <Text style={styles.rowTitle}>About</Text>
            <ChevronRight size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Section 3: Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.navRow} onPress={() => setDeleteModalVisible(true)}>
            <View style={styles.rowLeftInline}>
              <Trash2 size={20} color={C.danger} />
              <Text style={[styles.rowTitle, { color: C.danger, marginLeft: 12 }]}>Delete Account</Text>
            </View>
            <ChevronRight size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete your account, profile, progress, points, stages, and all app data. This action cannot be undone.
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Type DELETE to confirm"
              placeholderTextColor={C.muted}
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeleting}
            />

            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => !isDeleting && setDeleteChecked(!deleteChecked)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, deleteChecked && styles.checkboxChecked]}>
                {deleteChecked && <Check size={14} color={C.white} />}
              </View>
              <Text style={styles.checkboxText}>I understand this action cannot be undone.</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteInput('');
                  setDeleteChecked(false);
                }} 
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.deleteButton, 
                  (deleteInput !== 'DELETE' || !deleteChecked) && styles.deleteButtonDisabled
                ]} 
                onPress={handleDeleteAccount} 
                disabled={isDeleting || deleteInput !== 'DELETE' || !deleteChecked}
              >
                {isDeleting ? (
                  <Text style={styles.deleteButtonText}>Deleting...</Text>
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 14,
    fontFamily: displayFont,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 16,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 16,
  },
  rowLeftInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '600',
    color: C.text,
  },
  rowDesc: {
    fontSize: 13,
    fontFamily: displayFont,
    fontWeight: '400',
    color: C.sub,
    marginTop: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: displayFont,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: '400',
    color: C.sub,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: C.bg,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '600',
    color: C.text,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: C.danger,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: displayFont,
    fontWeight: '700',
    color: C.white,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: displayFont,
    color: C.text,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  checkboxChecked: {
    backgroundColor: C.text,
    borderColor: C.text,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontFamily: displayFont,
    color: C.text,
  },
  deleteButtonDisabled: {
    backgroundColor: C.muted,
    opacity: 0.5,
  },
});
