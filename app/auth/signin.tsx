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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignInScreen() {
  const [activeTab, setActiveTab] = useState<'email' | 'phone' | 'google'>('email');
  
  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone login
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login/email', {
        email,
        password,
      });
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      setToken(response.data.token);

      if (!response.data.user.onboarding_complete) {
        router.replace('/onboarding/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to sign in');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Navigate to Google sign up page (requires DOB for new users)
    router.push('/auth/signup-google');
  };

  const handleSendCode = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/phone/send-code', null, {
        params: { phone_number: phone }
      });
      setCodeSent(true);
      Alert.alert('Code Sent', 'A verification code has been sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Welcome back to Spotrr!</Text>
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
            style={[styles.tab, activeTab === 'phone' && styles.activeTab]}
            onPress={() => setActiveTab('phone')}
          >
            <Ionicons 
              name="call" 
              size={20} 
              color={activeTab === 'phone' ? '#FF6B6B' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'phone' && styles.activeTabText]}>
              Phone
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
              <Text style={styles.label}>Email</Text>
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phone Form */}
        {activeTab === 'phone' && (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {!codeSent ? (
              <TouchableOpacity
                style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signInText}>Send Code</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#666"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => Alert.alert('Info', 'Phone sign-in coming soon!')}
                >
                  <Text style={styles.signInText}>Verify & Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.note}>
              SMS verification will be sent to your phone
            </Text>
          </View>
        )}

        {/* Google Form */}
        {activeTab === 'google' && (
          <View style={styles.form}>
            <View style={styles.googleInfo}>
              <Ionicons name="logo-google" size={48} color="#4285F4" />
              <Text style={styles.googleTitle}>Sign in with Google</Text>
              <Text style={styles.googleSubtitle}>
                Quick and secure authentication
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.signInButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              Secure authentication with your Google account
            </Text>
          </View>
        )}

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    gap: 24,
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
  signInButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
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
  note: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
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
});