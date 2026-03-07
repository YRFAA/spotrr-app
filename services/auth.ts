import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  user_id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  profile_photos: string[];
  gym_ids: string[];
  custom_gym?: string;
  training_level?: string;
  persona_tag?: string;
  workout_focus: string[];
  max_distance_km: number;
  location?: { lat: number; lng: number };
  login_count: number;
  total_matches: number;
  xp_points: number;
  level: string;
  onboarding_complete: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  is_new_user: boolean;
  xp_gained?: number;
  level_up?: boolean;
}

export const authService = {
  async googleSignIn(idToken: string, email: string, name: string, dateOfBirth?: string): Promise<AuthResponse> {
    const response = await api.post('/auth/signup/google', {
      id_token: idToken,
      email,
      name,
      date_of_birth: dateOfBirth,
    });
    
    // Store token securely
    await AsyncStorage.setItem('auth_token', response.data.token);
    
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    await AsyncStorage.removeItem('auth_token');
  },
  
  async restoreSession(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return null;
      
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // Token invalid or expired
      await AsyncStorage.removeItem('auth_token');
      return null;
    }
  }
};