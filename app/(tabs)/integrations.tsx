import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface IntegrationStatus {
  spotify: { connected: boolean; data: any; profile: any };
  strava: { connected: boolean; data: any; athlete: any };
  facebook: { connected: boolean };
}

export default function IntegrationsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [connectingService, setConnectingService] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    spotify: { connected: false, data: null, profile: null },
    strava: { connected: false, data: null, athlete: null },
    facebook: { connected: false },
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/integrations/status');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = async () => {
    setConnectingService('spotify');
    try {
      const response = await api.get('/integrations/spotify/auth-url');
      const { auth_url } = response.data;
      
      const supported = await Linking.canOpenURL(auth_url);
      if (supported) {
        await Linking.openURL(auth_url);
      } else {
        Alert.alert('Error', 'Cannot open Spotify authorization page');
      }
    } catch (error) {
      console.error('Spotify auth error:', error);
      Alert.alert('Error', 'Failed to connect to Spotify');
    } finally {
      setConnectingService(null);
    }
  };

  const handleConnectStrava = async () => {
    setConnectingService('strava');
    try {
      const response = await api.get('/integrations/strava/auth-url');
      const { auth_url } = response.data;
      
      const supported = await Linking.canOpenURL(auth_url);
      if (supported) {
        await Linking.openURL(auth_url);
      } else {
        Alert.alert('Error', 'Cannot open Strava authorization page');
      }
    } catch (error) {
      console.error('Strava auth error:', error);
      Alert.alert('Error', 'Failed to connect to Strava');
    } finally {
      setConnectingService(null);
    }
  };

  const handleDisconnectSpotify = async () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/integrations/spotify/disconnect');
              loadIntegrations();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Spotify');
            }
          }
        }
      ]
    );
  };

  const handleDisconnectStrava = async () => {
    Alert.alert(
      'Disconnect Strava',
      'Are you sure you want to disconnect your Strava account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/integrations/strava/disconnect');
              loadIntegrations();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Strava');
            }
          }
        }
      ]
    );
  };

  const handleSyncStrava = async () => {
    setConnectingService('strava-sync');
    try {
      const response = await api.post('/integrations/strava/sync-workouts');
      Alert.alert('Success', `${response.data.workouts_synced} workouts synced!`);
      loadIntegrations();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync workouts');
    } finally {
      setConnectingService(null);
    }
  };

  const handleRefreshSpotify = async () => {
    setConnectingService('spotify-refresh');
    try {
      await api.post('/integrations/spotify/refresh');
      loadIntegrations();
      Alert.alert('Success', 'Spotify data refreshed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh Spotify data');
    } finally {
      setConnectingService(null);
    }
  };

  if (loading && !integrations.spotify.connected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4444" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/spotrr-logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Connect your favorite apps</Text>
        </View>

        {/* Spotify */}
        <View style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <View style={[styles.integrationIcon, { backgroundColor: '#1DB95420' }]}>
              <Ionicons name="musical-notes" size={28} color="#1DB954" />
            </View>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>Spotify</Text>
              <Text style={styles.integrationDescription}>
                {integrations.spotify.connected
                  ? `Connected as ${integrations.spotify.profile?.display_name || 'User'}`
                  : 'Show your workout music on your profile'}
              </Text>
            </View>
            <View style={[
              styles.statusDot, 
              integrations.spotify.connected ? styles.statusConnected : styles.statusDisconnected
            ]} />
          </View>

          {integrations.spotify.connected && integrations.spotify.data && (
            <View style={styles.integrationData}>
              {integrations.spotify.data.top_song && (
                <View style={styles.topSongCard}>
                  <Ionicons name="musical-note" size={20} color="#1DB954" />
                  <View style={styles.topSongInfo}>
                    <Text style={styles.topSongLabel}>Top Song</Text>
                    <Text style={styles.topSongText}>{integrations.spotify.data.top_song}</Text>
                  </View>
                </View>
              )}
              
              {integrations.spotify.data.top_artists?.length > 0 && (
                <View style={styles.artistsRow}>
                  <Text style={styles.artistsLabel}>Top Artists:</Text>
                  <Text style={styles.artistsText}>
                    {integrations.spotify.data.top_artists.slice(0, 3).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonRow}>
            {integrations.spotify.connected ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.refreshButton]}
                  onPress={handleRefreshSpotify}
                  disabled={connectingService === 'spotify-refresh'}
                >
                  {connectingService === 'spotify-refresh' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Refresh</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.disconnectButton]}
                  onPress={handleDisconnectSpotify}
                >
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: '#1DB954' }]}
                onPress={handleConnectSpotify}
                disabled={connectingService === 'spotify'}
              >
                {connectingService === 'spotify' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.connectButtonText}>Connect Spotify</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Strava */}
        <View style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <View style={[styles.integrationIcon, { backgroundColor: '#FC4C0220' }]}>
              <Ionicons name="bicycle" size={28} color="#FC4C02" />
            </View>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>Strava</Text>
              <Text style={styles.integrationDescription}>
                {integrations.strava.connected
                  ? `Connected as ${integrations.strava.athlete?.firstname || 'User'}`
                  : 'Sync your workouts and activities'}
              </Text>
            </View>
            <View style={[
              styles.statusDot, 
              integrations.strava.connected ? styles.statusConnected : styles.statusDisconnected
            ]} />
          </View>

          {integrations.strava.connected && integrations.strava.data && (
            <View style={styles.integrationData}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {integrations.strava.data.weekly_activities || 0}
                  </Text>
                  <Text style={styles.statLabel}>Activities</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {integrations.strava.data.total_distance?.toFixed(1) || 0}km
                  </Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {integrations.strava.data.total_elevation?.toFixed(0) || 0}m
                  </Text>
                  <Text style={styles.statLabel}>Elevation</Text>
                </View>
              </View>
              
              {integrations.strava.data.recent_workouts?.length > 0 && (
                <View style={styles.recentWorkouts}>
                  <Text style={styles.recentLabel}>Recent Activity:</Text>
                  <Text style={styles.recentText}>
                    {integrations.strava.data.recent_workouts[0]?.name} - {integrations.strava.data.recent_workouts[0]?.distance}km
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonRow}>
            {integrations.strava.connected ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FC4C02' }]}
                  onPress={handleSyncStrava}
                  disabled={connectingService === 'strava-sync'}
                >
                  {connectingService === 'strava-sync' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sync" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Sync</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.disconnectButton]}
                  onPress={handleDisconnectStrava}
                >
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: '#FC4C02' }]}
                onPress={handleConnectStrava}
                disabled={connectingService === 'strava'}
              >
                {connectingService === 'strava' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.connectButtonText}>Connect Strava</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FF4444" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Why connect?</Text>
            <Text style={styles.infoText}>
              Connected apps enhance your profile and help you find better gym matches based on your music taste and workout style.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  integrationCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  integrationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 13,
    color: '#aaa',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#666',
  },
  integrationData: {
    marginBottom: 16,
  },
  topSongCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  topSongInfo: {
    flex: 1,
  },
  topSongLabel: {
    fontSize: 11,
    color: '#aaa',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  topSongText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  artistsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  artistsLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  artistsText: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FC4C02',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#aaa',
  },
  recentWorkouts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  recentText: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  disconnectButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
});
