import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0c0c0c', '#1a1a2e', '#0c0c0c']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo Area */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/spotrr-logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Find Your Perfect Spotter</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem icon="📍" text="Match with lifters at your gym" />
            <FeatureItem icon="💪" text="Filter by strength level & goals" />
            <FeatureItem icon="🔥" text="Boost your visibility" />
            <FeatureItem icon="⚡" text="Super Spot your dream gym buddy" />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth/signin')}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoImage: {
    width: 280,
    height: 120,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
  },
  features: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  signInButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});
