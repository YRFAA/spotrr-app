import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'Maximum 6 photos allowed');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      uploadPhoto(base64Image);
    }
  };

  const uploadPhoto = async (base64Image: string) => {
    setUploading(true);
    try {
      await api.post('/profile/photos', {
        image: base64Image,
      });
      setPhotos([...photos, base64Image]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (index: number) => {
    try {
      await api.delete(`/profile/photos/${index}`);
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      setPhotos(newPhotos);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  const handleContinue = () => {
    if (photos.length === 0) {
      Alert.alert('Add Photos', 'Please add at least one photo to continue');
      return;
    }
    router.push('/onboarding/gym-selection');
  };

  const handleSkip = () => {
    router.push('/onboarding/gym-selection');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 1.5 of 4</Text>
        <Text style={styles.title}>Add Your Photos</Text>
        <Text style={styles.subtitle}>Show your best self (max 6 photos)</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePhoto(index)}
              >
                <Ionicons name="close-circle" size={32} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 6 && (
            <TouchableOpacity
              style={[styles.photoContainer, styles.addPhotoButton]}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#FF6B6B" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={64} color="#666" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <Text style={styles.tipText}>• Show your face clearly</Text>
          <Text style={styles.tipText}>• Add photos of you training</Text>
          <Text style={styles.tipText}>• Avoid group photos</Text>
          <Text style={styles.tipText}>• Keep it appropriate</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for Now</Text>
        </TouchableOpacity>
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  addPhotoButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  tips: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 40,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    alignItems: 'center',
  },
  skipText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
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
