import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  profile_photos: string[];
  gym_ids: string[];
  training_level: string;
  persona_tag: string;
  workout_focus: string[];
  xp_points: number;
  level: string;
}

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchModal, setMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await api.get('/matching/potential');
      setProfiles(response.data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];

    try {
      const response = await api.post('/matching/swipe', {
        swiped_id: profile.user_id,
        direction,
      });

      if (response.data.is_match) {
        setMatchedUser(profile);
        setMatchModal(true);
      }

      setCurrentIndex(currentIndex + 1);
      position.setValue({ x: 0, y: 0 });
    } catch (error) {
      console.error('Swipe failed:', error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right
          Animated.spring(position, {
            toValue: { x: width + 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => handleSwipe('right'));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left
          Animated.spring(position, {
            toValue: { x: -width - 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => handleSwipe('left'));
        } else {
          // Return to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={styles.noMoreText}>No more profiles nearby!</Text>
        <Text style={styles.noMoreSubtext}>Check back later or adjust your filters</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadProfiles}>
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Spotr</Text>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {profiles.slice(currentIndex, currentIndex + 2).reverse().map((profile, index) => {
          if (index === 1) {
            return (
              <Animated.View
                key={profile.user_id}
                style={[
                  styles.card,
                  {
                    transform: [{ rotate }, ...position.getTranslateTransform()],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri: profile.profile_photos[0] || 'https://via.placeholder.com/400' }}
                  style={styles.cardImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.gradient}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{profile.level}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{profile.training_level}</Text>
                      </View>
                    </View>
                    <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
                    <View style={styles.focusRow}>
                      {profile.workout_focus.slice(0, 3).map((focus) => (
                        <View key={focus} style={styles.focusBadge}>
                          <Text style={styles.focusText}>{focus}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </LinearGradient>

                {/* Like/Nope Labels */}
                <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
                  <Text style={styles.likeLabelText}>LIKE</Text>
                </Animated.View>
                <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
                  <Text style={styles.nopeLabelText}>PASS</Text>
                </Animated.View>
              </Animated.View>
            );
          }

          return (
            <View key={profile.user_id} style={[styles.card, { opacity: 0.5, transform: [{ scale: 0.95 }] }]}>
              <Image
                source={{ uri: profile.profile_photos[0] || 'https://via.placeholder.com/400' }}
                style={styles.cardImage}
              />
            </View>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => {
            Animated.spring(position, {
              toValue: { x: -width - 100, y: 0 },
              useNativeDriver: false,
            }).start(() => handleSwipe('left'));
          }}
        >
          <Ionicons name="close" size={32} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => {
            Animated.spring(position, {
              toValue: { x: width + 100, y: 0 },
              useNativeDriver: false,
            }).start(() => handleSwipe('right'));
          }}
        >
          <Ionicons name="heart" size={32} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      {matchModal && matchedUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>It's a Match!</Text>
            <Text style={styles.modalSubtitle}>You and {matchedUser.name} liked each other</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setMatchModal(false)}
            >
              <Text style={styles.modalButtonText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: width - 48,
    height: height * 0.6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  cardInfo: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 12,
  },
  focusRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  focusBadge: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  focusText: {
    color: '#aaa',
    fontSize: 12,
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    transform: [{ rotate: '20deg' }],
    borderWidth: 4,
    borderColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  likeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    transform: [{ rotate: '-20deg' }],
    borderWidth: 4,
    borderColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nopeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 40,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  passButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  noMoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  noMoreSubtext: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 32,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: width - 64,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});