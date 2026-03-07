import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { WORKOUT_FOCUS_LABELS } from '../../constants/enums';
import api from '../../services/api';

interface SubscriptionStatus {
  is_premium: boolean;
  has_gym_badge: boolean;
  boost_active: boolean;
  boost_expires?: string;
}

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const response = await api.get('/subscription/my-status');
      setSubscriptionStatus(response.data);
      if (user && response.data.is_premium !== user.is_premium) {
        setUser({ ...user, is_premium: response.data.is_premium });
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          logout();
          router.replace('/auth/welcome');
        },
      },
    ]);
  };

  if (!user) {
    return null;
  }

  const isPremium = subscriptionStatus?.is_premium || false;
  const hasGymBadge = subscriptionStatus?.has_gym_badge || false;
  const boostActive = subscriptionStatus?.boost_active || false;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/spotrr-logo.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#aaa" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Spotrr Pro Banner */}
      {!isPremium && (
        <TouchableOpacity 
          style={styles.premiumBanner}
          onPress={() => router.push('/(tabs)/premium')}
        >
          <View style={styles.premiumBannerContent}>
            <Text style={styles.proBadge}>PRO</Text>
            <View style={styles.premiumBannerText}>
              <Text style={styles.premiumBannerTitle}>Upgrade to Spotrrr Pro</Text>
              <Text style={styles.premiumBannerSubtitle}>Unlimited swipes, see likes & more!</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FF4444" />
        </TouchableOpacity>
      )}

      {/* Boost Active Banner */}
      {boostActive && (
        <View style={styles.boostBanner}>
          <Text style={styles.boostBannerText}>🔥 Boost Active - You're 5x more visible!</Text>
        </View>
      )}

      {/* Profile Info */}
      <View style={styles.profileCard}>
        {user.profile_photos && user.profile_photos.length > 0 ? (
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: user.profile_photos[0] }} style={styles.profileImage} />
            {isPremium && (
              <View style={styles.proBadgeOnImage}>
                <Text style={styles.proBadgeSmall}>PRO</Text>
              </View>
            )}
            {hasGymBadge && (
              <View style={styles.gymBadgeOnImage}>
                <Text style={styles.gymBadgeEmoji}>🏆</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editPhotosButton}
              onPress={() => router.push('/(tabs)/edit-photos')}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.profileImage, styles.profileImagePlaceholder]}
            onPress={() => router.push('/(tabs)/edit-photos')}
          >
            <Ionicons name="camera" size={48} color="#666" />
            <Text style={styles.addPhotoText}>Add Photos</Text>
          </TouchableOpacity>
        )}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}, {user.age}</Text>
          {isPremium && (
            <View style={styles.premiumBadgeInline}>
              <Text style={styles.proBadgeInlineText}>PRO</Text>
            </View>
          )}
          {hasGymBadge && (
            <Text style={styles.gymBadgeInline}>🏆</Text>
          )}
        </View>
        <Text style={styles.email}>{user.email}</Text>
        
        {/* Level Badge */}
        <View style={styles.levelBadge}>
          <Ionicons name="trophy" size={16} color="#FF4444" />
          <Text style={styles.levelText}>{user.level}</Text>
          <Text style={styles.xpText}>{user.xp_points} XP</Text>
        </View>
      </View>

      {/* Bio */}
      {user.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      )}

      {/* Training Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Info</Text>
        <View style={styles.infoRow}>
          <Ionicons name="fitness" size={20} color="#FF6B6B" />
          <Text style={styles.infoText}>
            {user.training_level ? user.training_level.charAt(0).toUpperCase() + user.training_level.slice(1) : 'Not set'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-circle" size={20} color="#FF6B6B" />
          <Text style={styles.infoText}>
            {user.persona_tag ? user.persona_tag.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Not set'}
          </Text>
        </View>
      </View>

      {/* Workout Focus */}
      {user.workout_focus && user.workout_focus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Focus</Text>
          <View style={styles.focusContainer}>
            {user.workout_focus.map((focus) => (
              <View key={focus} style={styles.focusTag}>
                <Text style={styles.focusTagText}>
                  {focus.charAt(0).toUpperCase() + focus.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Gyms */}
      {user.gym_ids && user.gym_ids.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gym Memberships</Text>
          <Text style={styles.infoText}>{user.gym_ids.length} gym(s) selected</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.total_matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.login_count}</Text>
            <Text style={styles.statLabel}>Logins</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.max_distance_km}km</Text>
            <Text style={styles.statLabel}>Max Distance</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  xpText: {
    fontSize: 12,
    color: '#aaa',
  },
  section: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#aaa',
  },
  focusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusTag: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  focusTagText: {
    fontSize: 12,
    color: '#aaa',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumBannerText: {
    gap: 2,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
  premiumBannerSubtitle: {
    fontSize: 13,
    color: '#aaa',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  premiumBadgeOnImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  premiumBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  headerLogo: {
    width: 100,
    height: 35,
  },
  proBadge: {
    backgroundColor: '#FF4444',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  boostBanner: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4444',
    alignItems: 'center',
  },
  boostBannerText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  proBadgeOnImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeSmall: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gymBadgeOnImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  gymBadgeEmoji: {
    fontSize: 12,
  },
  proBadgeInlineText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  gymBadgeInline: {
    fontSize: 16,
  },
  editPhotosButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0c0c0c',
  },
  addPhotoText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
});