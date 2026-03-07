import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatDistance } from 'date-fns';

interface Match {
  match_id: string;
  user: any;
  last_message: string | null;
  last_message_time: string;
  matched_at: string;
}

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await api.get('/matching/matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const timeAgo = formatDistance(new Date(item.last_message_time), new Date(), { addSuffix: true });

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => router.push(`/chat/${item.match_id}`)}
      >
        <Image
          source={{ uri: item.user.profile_photos[0] || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{item.user.name}, {item.user.age}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'Start a conversation...'}
          </Text>
        </View>
        <View style={styles.matchMeta}>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.count}>{matches.length} total</Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>No matches yet</Text>
          <Text style={styles.emptySubtext}>Keep swiping to find your gym buddy!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.match_id}
          contentContainerStyle={styles.list}
        />
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: '#aaa',
  },
  list: {
    paddingHorizontal: 24,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#aaa',
  },
  matchMeta: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});