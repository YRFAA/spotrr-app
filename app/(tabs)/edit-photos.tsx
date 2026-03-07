import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function EditPhotosScreen() {
  const { user, setUser } = useAuthStore();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.profile_photos) {
      setPhotos([...user.profile_photos]);
    }
  }, [user]);

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
      // Update user in store
      if (user) {
        setUser({ ...user, profile_photos: [...photos, base64Image] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (index: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/profile/photos/${index}`);
              const newPhotos = [...photos];
              newPhotos.splice(index, 1);
              setPhotos(newPhotos);
              setSelectedIndex(null);
              // Update user in store
              if (user) {
                setUser({ ...user, profile_photos: newPhotos });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          }
        }
      ]
    );
  };

  const movePhoto = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= photos.length) return;

    const newPhotos = [...photos];
    const temp = newPhotos[fromIndex];
    newPhotos[fromIndex] = newPhotos[toIndex];
    newPhotos[toIndex] = temp;
    setPhotos(newPhotos);
    setSelectedIndex(toIndex);
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    const photo = newPhotos.splice(index, 1)[0];
    newPhotos.unshift(photo);
    setPhotos(newPhotos);
    setSelectedIndex(0);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      // Create order array based on current photo positions vs original
      const originalPhotos = user?.profile_photos || [];
      const order = photos.map(photo => originalPhotos.indexOf(photo));
      
      // Only call reorder if order changed
      if (JSON.stringify(order) !== JSON.stringify([...Array(photos.length).keys()])) {
        await api.put('/profile/photos/reorder', { order });
      }
      
      // Update user in store
      if (user) {
        setUser({ ...user, profile_photos: photos });
      }
      
      Alert.alert('Success', 'Photos saved successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo order');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Photos</Text>
        <TouchableOpacity onPress={saveOrder} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#FF4444" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Tap to select, then use controls to reorder. First photo is your main profile pic.
      </Text>

      <ScrollView style={styles.scrollView}>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.photoContainer,
                selectedIndex === index && styles.photoSelected,
                index === 0 && styles.mainPhoto,
              ]}
              onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
            >
              <Image source={{ uri: photo }} style={styles.photo} />
              {index === 0 && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>MAIN</Text>
                </View>
              )}
              {selectedIndex === index && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={32} color="#FF4444" />
                </View>
              )}
            </TouchableOpacity>
          ))}

          {photos.length < 6 && (
            <TouchableOpacity
              style={[styles.photoContainer, styles.addPhotoButton]}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#FF4444" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={48} color="#666" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Controls */}
        {selectedIndex !== null && (
          <View style={styles.controls}>
            <Text style={styles.controlsTitle}>Photo {selectedIndex + 1} Selected</Text>
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={[styles.controlButton, selectedIndex === 0 && styles.controlButtonDisabled]}
                onPress={() => movePhoto(selectedIndex, 'up')}
                disabled={selectedIndex === 0}
              >
                <Ionicons name="arrow-up" size={20} color={selectedIndex === 0 ? '#666' : '#fff'} />
                <Text style={[styles.controlButtonText, selectedIndex === 0 && styles.controlButtonTextDisabled]}>
                  Move Up
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, selectedIndex === photos.length - 1 && styles.controlButtonDisabled]}
                onPress={() => movePhoto(selectedIndex, 'down')}
                disabled={selectedIndex === photos.length - 1}
              >
                <Ionicons name="arrow-down" size={20} color={selectedIndex === photos.length - 1 ? '#666' : '#fff'} />
                <Text style={[styles.controlButtonText, selectedIndex === photos.length - 1 && styles.controlButtonTextDisabled]}>
                  Move Down
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.mainButton, selectedIndex === 0 && styles.controlButtonDisabled]}
                onPress={() => setAsMain(selectedIndex)}
                disabled={selectedIndex === 0}
              >
                <Ionicons name="star" size={20} color={selectedIndex === 0 ? '#666' : '#FFD700'} />
                <Text style={[styles.controlButtonText, selectedIndex === 0 && styles.controlButtonTextDisabled]}>
                  Set as Main
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.deleteButton]}
                onPress={() => deletePhoto(selectedIndex)}
              >
                <Ionicons name="trash" size={20} color="#FF4444" />
                <Text style={[styles.controlButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <Text style={styles.tipText}>• Your first photo is shown on your profile card</Text>
          <Text style={styles.tipText}>• Show your face clearly</Text>
          <Text style={styles.tipText}>• Add photos of you training</Text>
          <Text style={styles.tipText}>• Avoid group photos</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSelected: {
    borderWidth: 3,
    borderColor: '#FF4444',
  },
  mainPhoto: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  controls: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  controlButtonTextDisabled: {
    color: '#666',
  },
  mainButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  deleteButtonText: {
    color: '#FF4444',
  },
  tips: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
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
});
