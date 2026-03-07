import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  TrainingLevel,
  PersonaTag,
  WorkoutFocus,
  TRAINING_LEVEL_LABELS,
  PERSONA_TAG_LABELS,
  WORKOUT_FOCUS_LABELS,
} from '../../constants/enums';

export default function TrainingInfoScreen() {
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null);
  const [personaTag, setPersonaTag] = useState<PersonaTag | null>(null);
  const [workoutFocus, setWorkoutFocus] = useState<WorkoutFocus[]>([]);
  const [maxDistance, setMaxDistance] = useState(10);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const toggleWorkoutFocus = (focus: WorkoutFocus) => {
    if (workoutFocus.includes(focus)) {
      setWorkoutFocus(workoutFocus.filter((f) => f !== focus));
    } else {
      setWorkoutFocus([...workoutFocus, focus]);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby gym buddies');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      Alert.alert('Success', 'Location set successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleContinue = async () => {
    if (!trainingLevel || !personaTag || workoutFocus.length === 0) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please enable location to find gym buddies nearby');
      return;
    }

    try {
      const response = await api.put('/profile/', {
        training_level: trainingLevel,
        persona_tag: personaTag,
        workout_focus: workoutFocus,
        max_distance_km: maxDistance,
        location: location,
        onboarding_complete: true,
      });

      // Update user in store
      if (user) {
        setUser({ ...user, onboarding_complete: true });
      }

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 4</Text>
        <Text style={styles.title}>Training Preferences</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Training Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Level</Text>
          <View style={styles.optionsRow}>
            {Object.values(TrainingLevel).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  trainingLevel === level && styles.optionButtonSelected,
                ]}
                onPress={() => setTrainingLevel(level)}
              >
                <Text
                  style={[
                    styles.optionText,
                    trainingLevel === level && styles.optionTextSelected,
                  ]}
                >
                  {TRAINING_LEVEL_LABELS[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Persona Tag */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Persona</Text>
          <View style={styles.optionsGrid}>
            {Object.values(PersonaTag).map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.gridButton,
                  personaTag === tag && styles.gridButtonSelected,
                ]}
                onPress={() => setPersonaTag(tag)}
              >
                <Text
                  style={[
                    styles.gridText,
                    personaTag === tag && styles.gridTextSelected,
                  ]}
                >
                  {PERSONA_TAG_LABELS[tag]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout Focus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Focus (Select multiple)</Text>
          <View style={styles.optionsGrid}>
            {Object.values(WorkoutFocus).map((focus) => (
              <TouchableOpacity
                key={focus}
                style={[
                  styles.gridButton,
                  workoutFocus.includes(focus) && styles.gridButtonSelected,
                ]}
                onPress={() => toggleWorkoutFocus(focus)}
              >
                <Text
                  style={[
                    styles.gridText,
                    workoutFocus.includes(focus) && styles.gridTextSelected,
                  ]}
                >
                  {WORKOUT_FOCUS_LABELS[focus]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Distance & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Max Distance: {maxDistance}km</Text>
          <View style={styles.distanceButtons}>
            {[5, 10, 15, 20, 30].map((dist) => (
              <TouchableOpacity
                key={dist}
                style={[
                  styles.distanceButton,
                  maxDistance === dist && styles.distanceButtonSelected,
                ]}
                onPress={() => setMaxDistance(dist)}
              >
                <Text
                  style={[
                    styles.distanceText,
                    maxDistance === dist && styles.distanceTextSelected,
                  ]}
                >
                  {dist}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.locationButton, location && styles.locationButtonActive]}
            onPress={requestLocation}
          >
            <Text style={styles.locationButtonText}>
              {location ? '✓ Location Enabled' : 'Enable Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Complete Setup</Text>
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
  },
  gridButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  gridText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  gridTextSelected: {
    color: '#fff',
  },
  distanceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  distanceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  distanceButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  distanceText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  distanceTextSelected: {
    color: '#fff',
  },
  locationButton: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#4CAF50',
  },
  locationButtonText: {
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