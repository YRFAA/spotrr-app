import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import * as Location from 'expo-location';

interface Plan {
  id: string;
  name: string;
  price_display: number;
  price: number;
  currency: string;
  symbol: string;
  description: string;
  features: string[];
  duration_days?: number;
}

interface Microtransaction {
  id: string;
  name: string;
  emoji: string;
  price_display: number;
  price: number;
  currency: string;
  symbol: string;
  description: string;
}

interface SubscriptionStatus {
  is_premium: boolean;
  plan_id: string;
  plan_name: string;
  features: string[];
  premium_expires?: string;
  boost_active: boolean;
  boost_expires?: string;
  has_gym_badge: boolean;
  weekly_boost_available: boolean;
}

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, setUser } = useAuthStore();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [microtransactions, setMicrotransactions] = useState<Microtransaction[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [symbol, setSymbol] = useState('$');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    detectCurrencyAndLoadData();
  }, []);

  useEffect(() => {
    if (params.reference) {
      verifyPayment(params.reference as string);
    }
  }, [params.reference]);

  const detectCurrencyAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Try to detect country from location
      let detectedCurrency = 'USD';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          // Map country to currency
          const countryToCurrency: { [key: string]: string } = {
            'South Africa': 'ZAR',
            'Nigeria': 'NGN',
            'Ghana': 'GHS',
            'Kenya': 'KES',
          };
          
          if (address?.country && countryToCurrency[address.country]) {
            detectedCurrency = countryToCurrency[address.country];
          }
        }
      } catch (e) {
        console.log('Location detection failed, using USD');
      }
      
      setCurrency(detectedCurrency);
      
      // Load plans with detected currency
      const [plansRes, statusRes] = await Promise.all([
        api.get(`/subscription/plans?currency=${detectedCurrency}`),
        api.get('/subscription/my-status'),
      ]);
      
      setPlans(plansRes.data.plans.filter((p: Plan) => p.price_display > 0));
      setMicrotransactions(plansRes.data.microtransactions || []);
      setSymbol(plansRes.data.symbol || '$');
      setStatus(statusRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setProcessing(true);
      const response = await api.get(`/subscription/verify/${reference}`);
      
      if (response.data.status === 'success') {
        Alert.alert(
          'Success! 🎉',
          response.data.message,
          [{ text: 'Awesome!', onPress: () => detectCurrencyAndLoadData() }]
        );
        if (user) {
          setUser({ ...user, is_premium: true });
        }
      } else if (response.data.status === 'failed') {
        Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.');
      } else {
        Alert.alert('Processing', 'Your payment is being processed. Please check back shortly.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(true);
      const callbackUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}/premium?reference={reference}`;
      
      const response = await api.post('/subscription/initialize', {
        plan_id: planId,
        callback_url: callbackUrl,
        currency: currency,
      });
      
      if (response.data.authorization_url) {
        const supported = await Linking.canOpenURL(response.data.authorization_url);
        if (supported) {
          await Linking.openURL(response.data.authorization_url);
        } else {
          Alert.alert('Error', 'Cannot open payment page');
        }
      }
    } catch (error: any) {
      console.error('Subscribe error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setProcessing(true);
      const callbackUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}/premium?reference={reference}`;
      
      const response = await api.post('/subscription/purchase', {
        product_id: productId,
        callback_url: callbackUrl,
        currency: currency,
      });
      
      if (response.data.authorization_url) {
        const supported = await Linking.canOpenURL(response.data.authorization_url);
        if (supported) {
          await Linking.openURL(response.data.authorization_url);
        } else {
          Alert.alert('Error', 'Cannot open payment page');
        }
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleWeeklyBoost = async () => {
    try {
      setProcessing(true);
      const response = await api.post('/subscription/use-weekly-boost');
      Alert.alert('Boost Activated! 🔥', response.data.message);
      detectCurrencyAndLoadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to activate boost');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4444" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Image 
            source={require('../../assets/images/spotrr-logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ width: 40 }} />
        </View>

        {/* Current Status */}
        {status?.is_premium && (
          <View style={styles.statusCard}>
            <View style={styles.statusBadge}>
              <Text style={styles.proBadge}>PRO</Text>
              <Text style={styles.statusText}>Spotrr Pro Active</Text>
            </View>
            <Text style={styles.statusSubtext}>
              Expires: {status.premium_expires 
                ? new Date(status.premium_expires).toLocaleDateString()
                : 'Never'}
            </Text>
            
            {/* Weekly Boost for Pro */}
            {status.weekly_boost_available && !status.boost_active && (
              <TouchableOpacity 
                style={styles.weeklyBoostButton}
                onPress={handleWeeklyBoost}
                disabled={processing}
              >
                <Text style={styles.weeklyBoostText}>🔥 Use Free Weekly Boost</Text>
              </TouchableOpacity>
            )}
            
            {status.boost_active && (
              <View style={styles.boostActiveIndicator}>
                <Text style={styles.boostActiveText}>
                  🔥 Boost Active until {new Date(status.boost_expires!).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Hero Section */}
        {!status?.is_premium && (
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
            <Text style={styles.heroSubtitle}>
              Go Pro and dominate the gym matching game
            </Text>
          </View>
        )}

        {/* Spotrr Pro Plan */}
        {!status?.is_premium && plans.length > 0 && (
          <View style={styles.proSection}>
            <View style={styles.proCard}>
              <View style={styles.proHeader}>
                <Text style={styles.proBadgeLarge}>SPOTR PRO</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currency}>{symbol}</Text>
                  <Text style={styles.price}>{plans[0]?.price_display?.toLocaleString()}</Text>
                  <Text style={styles.period}>/month</Text>
                </View>
              </View>
              
              <View style={styles.featuresGrid}>
                {[
                  { icon: 'infinite', text: 'Unlimited swipes' },
                  { icon: 'eye', text: 'See who liked you' },
                  { icon: 'options', text: 'Advanced filters' },
                  { icon: 'shield-checkmark', text: 'Match with verified lifters' },
                  { icon: 'rocket', text: 'Free weekly boost' },
                  { icon: 'star', text: 'Priority visibility' },
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name={feature.icon as any} size={20} color="#FF4444" />
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscribe('spotr_pro')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.subscribeButtonText}>Get Spotrr Pro</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Microtransactions */}
        <View style={styles.microSection}>
          <Text style={styles.sectionTitle}>Power-Ups</Text>
          <Text style={styles.sectionSubtitle}>Boost your chances instantly</Text>
          
          {microtransactions.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.microCard}
              onPress={() => handlePurchase(product.id)}
              disabled={processing}
            >
              <View style={styles.microInfo}>
                <Text style={styles.microEmoji}>{product.emoji}</Text>
                <View style={styles.microTextContainer}>
                  <Text style={styles.microName}>{product.name}</Text>
                  <Text style={styles.microDesc}>{product.description}</Text>
                </View>
              </View>
              <View style={styles.microPriceContainer}>
                <Text style={styles.microPrice}>
                  {product.symbol}{product.price_display?.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Badges Section */}
        {status?.has_gym_badge && (
          <View style={styles.badgeSection}>
            <View style={styles.badgeCard}>
              <Text style={styles.badgeEmoji}>🏆</Text>
              <Text style={styles.badgeText}>Elite Gym Badge Active</Text>
            </View>
          </View>
        )}

        {/* Free Tier Info */}
        {!status?.is_premium && (
          <View style={styles.freeSection}>
            <Text style={styles.freeSectionTitle}>Free Tier Includes:</Text>
            <View style={styles.freeFeatures}>
              {[
                'Create profile',
                'Limited swipes (15/day)',
                'Basic matching',
                'Match within 5km',
              ].map((feature, index) => (
                <View key={index} style={styles.freeFeatureRow}>
                  <Ionicons name="checkmark" size={16} color="#666" />
                  <Text style={styles.freeFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure payment powered by Paystack
          </Text>
          <View style={styles.footerIcons}>
            <Ionicons name="lock-closed" size={16} color="#666" />
            <Ionicons name="card" size={16} color="#666" />
            <Ionicons name="shield-checkmark" size={16} color="#666" />
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
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  statusCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  proBadge: {
    backgroundColor: '#FF4444',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  weeklyBoostButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  weeklyBoostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  boostActiveIndicator: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  boostActiveText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '500',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  proSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  proCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  proHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  proBadgeLarge: {
    backgroundColor: '#FF4444',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    overflow: 'hidden',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currency: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  period: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
    marginLeft: 4,
  },
  featuresGrid: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
  },
  subscribeButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  microSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  microCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  microInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  microEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  microTextContainer: {
    flex: 1,
  },
  microName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  microDesc: {
    fontSize: 13,
    color: '#aaa',
  },
  microPriceContainer: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  microPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 12,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  freeSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  freeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  freeFeatures: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
  },
  freeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  freeFeatureText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
});
