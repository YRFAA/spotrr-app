import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { Gym } from '../../constants/gyms';

export default function GymSelectionScreen() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGyms, setSelectedGyms] = useState<string[]>([]);
  const [customGym, setCustomGym] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      const response = await api.get('/gyms/');
      setGyms(response.data);
    } catch (error) {
      console.error('Failed to load gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGym = (gymId: string) => {
    if (selectedGyms.includes(gymId)) {
      setSelectedGyms(selectedGyms.filter((id) => id !== gymId));
    } else {
      setSelectedGyms([...selectedGyms, gymId]);
    }
  };

  const handleAddCustomGym = async () => {
    if (!customGym.trim()) return;

    try {
      const response = await api.post('/gyms/custom', {
        name: customGym,
      });
      setGyms([...gyms, response.data]);
      setSelectedGyms([...selectedGyms, response.data.gym_id]);
      setCustomGym('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add custom gym');
    }
  };

  const handleContinue = async () => {
    if (selectedGyms.length === 0) {
      Alert.alert('Error', 'Please select at least one gym');
      return;
    }

    try {
      await api.put('/profile/', {
        gym_ids: selectedGyms,
      });
      router.push('/onboarding/training-info');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
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
        <Text style={styles.step}>Step 2 of 4</Text>
        <Text style={styles.title}>Where do you train?</Text>
        <Text style={styles.subtitle}>Select all that apply</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.gymList}>
          {gyms.map((gym) => (
            <TouchableOpacity
              key={gym.gym_id}
              style={[
                styles.gymCard,
                selectedGyms.includes(gym.gym_id) && styles.gymCardSelected,
              ]}
              onPress={() => toggleGym(gym.gym_id)}
            >
              <Text
                style={[
                  styles.gymName,
                  selectedGyms.includes(gym.gym_id) && styles.gymNameSelected,
                ]}
              >
                {gym.name}
              </Text>
              {gym.is_custom && <Text style={styles.customBadge}>Custom</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customSection}>
          <Text style={styles.customTitle}>Add Custom Gym</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              placeholder="e.g., My CrossFit Box"
              placeholderTextColor="#666"
              value={customGym}
              onChangeText={setCustomGym}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCustomGym}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  step: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  gymList: {
    gap: 12,
    marginBottom: 32,
  },
  gymCard: {
    backgroundColor: '#1a1a2e',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B20',
  },
  gymName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  gymNameSelected: {
    color: '#FF6B6B',
  },
  customBadge: {
    fontSize: 12,
    color: '#FF6B6B',
    backgroundColor: '#FF6B6B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customSection: {
    marginBottom: 32,
  },
  customTitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
    fontWeight: '500',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  addButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});