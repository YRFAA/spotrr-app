import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
  const [activeTab, setActiveTab] = useState<'email' | 'google'>('email');
  
  // Common fields
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Email signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  // Calculate max date (18 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  
  // Calculate min date (100 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const validateAge = (): boolean => {
    if (!dateOfBirth) {
      Alert.alert('Required', 'Please select your date of birth');
      return false;
    }
    
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    if (age < 18) {
      Alert.alert('Age Restriction', 'You must be at least 18 years old to sign up');
      return false;
    }
    
    return true;
  };

  const handleEmailSignup = async () => {
    if (!name || !email || !password || !confirmPassword || !dateOfBirth) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!validateAge()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup/email', {
        email,
        password,
        name,
        date_of_birth: formatDate(dateOfBirth),
      });
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      setToken(response.data.token);
      
      router.replace('/onboarding/profile-setup');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to sign up');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    router.push('/auth/signup-google');
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dateOfBirth || maxDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={maxDate}
                minimumDate={minDate}
                textColor="#fff"
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      );
    }

    if (showDatePicker) {
      return (
        <DateTimePicker
          value={dateOfBirth || maxDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Spotrr and find your gym buddy!</Text>
          <Text style={styles.ageNotice}>18+ Only</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'email' && styles.activeTab]}
            onPress={() => setActiveTab('email')}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color={activeTab === 'email' ? '#FF6B6B' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'google' && styles.activeTab]}
            onPress={() => setActiveTab('google')}
          >
            <Ionicons 
              name="logo-google" 
              size={20} 
              color={activeTab === 'google' ? '#FF6B6B' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'google' && styles.activeTabText]}>
              Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Form */}
        {activeTab === 'email' && (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth * (18+ only)</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#FF6B6B" />
                <Text style={[styles.datePickerText, !dateOfBirth && styles.datePickerPlaceholder]}>
                  {dateOfBirth ? formatDisplayDate(dateOfBirth) : 'Select your date of birth'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password * (min 6 characters)</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleEmailSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Google Form */}
        {activeTab === 'google' && (
          <View style={styles.form}>
            <View style={styles.googleInfo}>
              <Ionicons name="logo-google" size={48} color="#4285F4" />
              <Text style={styles.googleTitle}>Sign up with Google</Text>
              <Text style={styles.googleSubtitle}>
                Quick and secure registration
              </Text>
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignup}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signin')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderDatePicker()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  ageNotice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  activeTab: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B20',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 12,
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: '#666',
  },
  signUpButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  googleInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  googleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  googleSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4285F4',
    paddingVertical: 18,
    borderRadius: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#aaa',
    fontSize: 14,
  },
  footerLink: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalDone: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
