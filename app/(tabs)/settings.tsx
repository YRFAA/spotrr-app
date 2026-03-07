import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface Reason {
  id: string;
  label: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deactivationReasons, setDeactivationReasons] = useState<Reason[]>([]);
  const [deletionReasons, setDeletionReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = async () => {
    try {
      const [deactivateRes, deleteRes] = await Promise.all([
        api.get('/account/deactivation-reasons'),
        api.get('/account/deletion-reasons'),
      ]);
      setDeactivationReasons(deactivateRes.data.reasons);
      setDeletionReasons(deleteRes.data.reasons);
    } catch (error) {
      console.error('Failed to load reasons:', error);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedReason) {
      Alert.alert('Please select a reason', 'We\'d like to know why you\'re taking a break.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/account/deactivate', {
        reason_id: selectedReason,
        reason_text: selectedReason === 'other' ? otherReasonText : null,
      });

      Alert.alert(
        'Account Deactivated',
        response.data.message,
        [
          {
            text: 'OK',
            onPress: () => {
              logout();
              router.replace('/auth/welcome');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to deactivate account');
    } finally {
      setLoading(false);
      setShowDeactivateModal(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReason) {
      Alert.alert('Please select a reason', 'We\'d like to know why you\'re leaving.');
      return;
    }

    if (!confirmDelete) {
      Alert.alert(
        'Are you absolutely sure?',
        'This action cannot be undone. All your data including matches, messages, and workout history will be permanently deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Delete Everything',
            style: 'destructive',
            onPress: () => setConfirmDelete(true),
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/account/delete', {
        reason_id: selectedReason,
        reason_text: selectedReason === 'other' ? otherReasonText : null,
        confirm_deletion: true,
      });

      Alert.alert(
        'Account Deleted',
        response.data.message,
        [
          {
            text: 'OK',
            onPress: () => {
              logout();
              router.replace('/auth/welcome');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setConfirmDelete(false);
    }
  };

  const ReasonModal = ({
    visible,
    onClose,
    title,
    subtitle,
    reasons,
    onSubmit,
    isDelete = false,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
    reasons: Reason[];
    onSubmit: () => void;
    isDelete?: boolean;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>{subtitle}</Text>

          <ScrollView style={styles.reasonsList}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.radioOuter}>
                  {selectedReason === reason.id && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.reasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isDelete && styles.deleteButton,
              loading && styles.disabledButton,
            ]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isDelete ? 'Delete My Account' : 'Deactivate Account'}
              </Text>
            )}
          </TouchableOpacity>

          {!isDelete && (
            <Text style={styles.noteText}>
              You can reactivate your account anytime by logging back in.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="person-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="lock-closed-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-outline" size={24} color="#fff" />
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity
            style={[styles.settingItem, styles.warningItem]}
            onPress={() => {
              setSelectedReason(null);
              setShowDeactivateModal(true);
            }}
          >
            <Ionicons name="pause-circle-outline" size={24} color="#FFA500" />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: '#FFA500' }]}>
                Deactivate Account
              </Text>
              <Text style={styles.settingSubtext}>
                Take a break from Spotrr
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFA500" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => {
              setSelectedReason(null);
              setConfirmDelete(false);
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#FF4444" />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: '#FF4444' }]}>
                Delete Account
              </Text>
              <Text style={styles.settingSubtext}>
                Permanently delete all your data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Deactivation Modal */}
      <ReasonModal
        visible={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Taking a break?"
        subtitle="We'd love to know why so we can improve Spotrr."
        reasons={deactivationReasons}
        onSubmit={handleDeactivate}
      />

      {/* Deletion Modal */}
      <ReasonModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="We're sad to see you go"
        subtitle="Please let us know why you're leaving."
        reasons={deletionReasons}
        onSubmit={handleDelete}
        isDelete
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  warningItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  reasonsList: {
    maxHeight: 300,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a3e',
    marginBottom: 8,
    gap: 12,
  },
  reasonItemSelected: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});
