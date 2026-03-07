import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

interface GamificationStats {
  xp_points: number;
  level: string;
  login_count: number;
  login_streak: number;
  total_matches: number;
  total_workouts: number;
  badges: Array<{ name: string; icon: string; achieved_at: string }>;
}

interface WorkoutStats {
  total_workouts: number;
  total_volume: number;
  pull_ups_total: number;
  push_ups_total: number;
  personal_bests: Record<string, number>;
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [gamRes, workRes] = await Promise.all([
        api.get('/gamification/stats'),
        api.get('/workouts/stats'),
      ]);
      setGamificationStats(gamRes.data);
      setWorkoutStats(workRes.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const xpProgress = gamificationStats ? (gamificationStats.xp_points % 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      {/* XP Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Level & XP</Text>
        <Text style={styles.level}>{gamificationStats?.level || 'Gym Rookie'}</Text>
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>{gamificationStats?.xp_points || 0} XP</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={32} color="#FF6B6B" />
          <Text style={styles.statValue}>{gamificationStats?.login_streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart" size={32} color="#FF6B6B" />
          <Text style={styles.statValue}>{gamificationStats?.total_matches || 0}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={32} color="#FF6B6B" />
          <Text style={styles.statValue}>{workoutStats?.total_workouts || 0}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={32} color="#FF6B6B" />
          <Text style={styles.statValue}>{Math.round((workoutStats?.total_volume || 0) / 1000)}k</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
      </View>

      {/* Badges */}
      {gamificationStats && gamificationStats.badges.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Badges</Text>
          <View style={styles.badgesContainer}>
            {gamificationStats.badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Personal Bests */}
      {workoutStats && Object.keys(workoutStats.personal_bests).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Bests</Text>
          {Object.entries(workoutStats.personal_bests).slice(0, 5).map(([exercise, weight]) => (
            <View key={exercise} style={styles.pbRow}>
              <Text style={styles.pbExercise}>{exercise}</Text>
              <Text style={styles.pbWeight}>{weight}kg</Text>
            </View>
          ))}
        </View>
      )}

      {/* Special Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Special Achievements</Text>
        <View style={styles.achievementRow}>
          <Ionicons name="arrow-up" size={24} color="#4CAF50" />
          <Text style={styles.achievementText}>{workoutStats?.pull_ups_total || 0} Pull-ups</Text>
        </View>
        <View style={styles.achievementRow}>
          <Ionicons name="arrow-down" size={24} color="#2196F3" />
          <Text style={styles.achievementText}>{workoutStats?.push_ups_total || 0} Push-ups</Text>
        </View>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  card: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  level: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  xpContainer: {
    gap: 8,
  },
  xpText: {
    fontSize: 16,
    color: '#aaa',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  pbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  pbExercise: {
    fontSize: 14,
    color: '#fff',
  },
  pbWeight: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  achievementText: {
    fontSize: 16,
    color: '#fff',
  },
});