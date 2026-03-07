import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';

export default function RootLayout() {
  const { user, isLoading, setUser, setToken, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          setToken(token);
          const userData = await authService.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuth) {
      // Redirect to auth
      router.replace('/auth/welcome');
    } else if (user && !user.onboarding_complete && !inOnboarding) {
      // Redirect to onboarding
      router.replace('/onboarding/profile-setup');
    } else if (user && user.onboarding_complete && (inAuth || inOnboarding)) {
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
  },
});