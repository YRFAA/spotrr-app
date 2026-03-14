import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const CARD_H = SCREEN_H;

type Profile = {
  user_id: number;
  name: string;
  age: number | null;
  bio: string | null;
  gym: string | null;
  location: string | null;
  goals: string[] | null;
  muscle_groups: string[] | null;
  availability: string[] | null;
  photos: string[] | null;
  workout_frequency: string | null;
  is_premium: boolean;
};

function ProfileCard({ profile, onLike, onPass }: {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
}) {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const lastX = useRef(0);
  const isDragging = useRef(false);

  const panHandlers = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: any) => {
      lastX.current = e.nativeEvent.pageX;
      isDragging.current = true;
    },
    onResponderMove: (e: any) => {
      const dx = e.nativeEvent.pageX - lastX.current;
      swipeAnim.setValue(dx);
      tiltAnim.setValue(dx * 0.1);
    },
    onResponderRelease: (e: any) => {
      const dx = e.nativeEvent.pageX - lastX.current;
      isDragging.current = false;
      if (dx > 80) {
        Animated.timing(swipeAnim, { toValue: SCREEN_W + 100, duration: 200, useNativeDriver: true }).start(onLike);
      } else if (dx < -80) {
        Animated.timing(swipeAnim, { toValue: -(SCREEN_W + 100), duration: 200, useNativeDriver: true }).start(onPass);
      } else {
        Animated.parallel([
          Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }),
          Animated.spring(tiltAnim, { toValue: 0, useNativeDriver: true }),
        ]).start();
      }
    },
  };

  const likeOpacity = swipeAnim.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: "clamp" });
  const passOpacity = swipeAnim.interpolate({ inputRange: [-60, 0], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: swipeAnim },
            { rotate: tiltAnim.interpolate({ inputRange: [-20, 20], outputRange: ["-15deg", "15deg"] }) },
          ],
        },
      ]}
      {...panHandlers}
    >
      <LinearGradient colors={["#E53935", "#7B1FA2"]} style={styles.cardGradient}>
        <Text style={styles.avatarInitial}>{profile.name?.[0] ?? "?"}</Text>
      </LinearGradient>

      <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
        <Text style={styles.stampText}>LIKE ❤️</Text>
      </Animated.View>
      <Animated.View style={[styles.passStamp, { opacity: passOpacity }]}>
        <Text style={styles.stampText}>PASS ✕</Text>
      </Animated.View>

      <LinearGradient colors={["transparent", "rgba(0,0,0,0.95)"]} style={styles.cardOverlay}>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{profile.name}{profile.age ? `, ${profile.age}` : ""}</Text>
            {profile.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ PRO</Text>
              </View>
            )}
          </View>
          {profile.gym && (
            <View style={styles.gymRow}>
              <Feather name="activity" size={13} color="#aaa" />
              <Text style={styles.gymText}>{profile.gym}</Text>
            </View>
          )}
          {profile.location && (
            <View style={styles.gymRow}>
              <Feather name="map-pin" size={13} color="#aaa" />
              <Text style={styles.gymText}>{profile.location}</Text>
            </View>
          )}
          {profile.bio ? <Text style={styles.cardBio} numberOfLines={2}>{profile.bio}</Text> : null}
          {profile.goals?.length ? (
            <View style={styles.tagsRow}>
              {profile.goals.slice(0, 3).map((g) => (
                <View key={g} style={styles.tag}>
                  <Text style={styles.tagText}>{g}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.cardActions}>
        <Pressable
          onPress={onPass}
          style={({ pressed }) => [styles.actionBtn, styles.passBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="x" size={28} color="#888" />
        </Pressable>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => [styles.actionBtn, styles.likeBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="heart" size={26} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterGym, setFilterGym] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [appliedGym, setAppliedGym] = useState("");
  const [passedIds, setPassedIds] = useState<Set<number>>(new Set());
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const feedRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const { data: profiles = [], isLoading, error, refetch } = useQuery<Profile[]>({
    queryKey: ["discover", appliedGym],
    queryFn: () =>
      apiRequest(`/api/discover${appliedGym ? `?gym=${encodeURIComponent(appliedGym)}` : ""}`),
    staleTime: 0,
  });

  const visibleProfiles = profiles.filter((p) => !passedIds.has(p.user_id));

  const handleSwipe = useCallback(async (profile: Profile, direction: "left" | "right") => {
    setPassedIds((prev) => new Set([...prev, profile.user_id]));
    try {
      const result = await apiRequest("/api/swipe", {
        method: "POST",
        body: JSON.stringify({ swipedId: profile.user_id, direction }),
      });
      if (result.matched) {
        setMatchedProfile(profile);
        queryClient.invalidateQueries({ queryKey: ["matches"] });
      }
    } catch (e: any) {
      console.error("Swipe error:", e.message);
    }
  }, []);

  const handleLike = useCallback((profile: Profile) => handleSwipe(profile, "right"), [handleSwipe]);
  const handlePass = useCallback((profile: Profile) => handleSwipe(profile, "left"), [handleSwipe]);

  const applyFilter = () => {
    setAppliedGym(filterGym.trim());
    setShowFilter(false);
    setPassedIds(new Set());
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="wifi-off" size={40} color="#444" />
        <Text style={styles.emptyText}>Couldn't load profiles</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.logoText}>Spotrr</Text>
        <Pressable onPress={() => setShowFilter(true)} style={styles.filterBtn}>
          <Feather name="sliders" size={20} color="#fff" />
          {appliedGym ? <View style={styles.filterDot} /> : null}
        </Pressable>
      </View>

      {/* Feed */}
      {visibleProfiles.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Feather name="users" size={60} color="#2a2a2a" />
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptyText}>Check back later or adjust your filters</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => { setPassedIds(new Set()); refetch(); }}
          >
            <Text style={styles.retryText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={feedRef}
          data={visibleProfiles}
          keyExtractor={(p) => String(p.user_id)}
          pagingEnabled
          snapToInterval={SCREEN_H}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ height: SCREEN_H, width: SCREEN_W }}>
              <ProfileCard
                profile={item}
                onLike={() => handleLike(item)}
                onPass={() => handlePass(item)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: botPad }}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.filterTitle}>Filter Profiles</Text>
            <Text style={styles.filterLabel}>Gym Name</Text>
            <TextInput
              style={styles.filterInput}
              value={filterGym}
              onChangeText={setFilterGym}
              placeholder="e.g. Planet Fitness"
              placeholderTextColor="#555"
            />
            <Pressable style={styles.applyBtn} onPress={applyFilter}>
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </Pressable>
            {appliedGym && (
              <Pressable
                style={styles.clearBtn}
                onPress={() => { setFilterGym(""); setAppliedGym(""); setShowFilter(false); setPassedIds(new Set()); }}
              >
                <Text style={styles.clearBtnText}>Clear Filter</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Match Modal */}
      {matchedProfile && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.matchOverlay}>
            <LinearGradient colors={["#E53935", "#7B1FA2"]} style={styles.matchModal}>
              <Text style={styles.matchEmoji}>🎉</Text>
              <Text style={styles.matchTitle}>It's a Match!</Text>
              <Text style={styles.matchSub}>
                You and {matchedProfile.name} liked each other!
              </Text>
              <View style={styles.matchActions}>
                <Pressable
                  style={styles.matchChatBtn}
                  onPress={() => { setMatchedProfile(null); router.push("/(tabs)/matches"); }}
                >
                  <Text style={styles.matchChatBtnText}>Go to Matches</Text>
                </Pressable>
                <Pressable style={styles.matchSkipBtn} onPress={() => setMatchedProfile(null)}>
                  <Text style={styles.matchSkipBtnText}>Keep Swiping</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logoText: { fontSize: 28, fontWeight: "800", color: "#E53935", letterSpacing: -1 },
  filterBtn: { padding: 8, position: "relative" },
  filterDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53935",
  },
  card: {
    flex: 1,
    backgroundColor: "#111",
    overflow: "hidden",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 120,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.2)",
  },
  likeStamp: {
    position: "absolute",
    top: 80,
    left: 20,
    borderWidth: 4,
    borderColor: "#4CAF50",
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: "-15deg" }],
    zIndex: 5,
  },
  passStamp: {
    position: "absolute",
    top: 80,
    right: 20,
    borderWidth: 4,
    borderColor: "#E53935",
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: "15deg" }],
    zIndex: 5,
  },
  stampText: { fontSize: 22, fontWeight: "800", color: "#fff" },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingBottom: 100,
  },
  cardInfo: { paddingHorizontal: 20, gap: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardName: { fontSize: 28, fontWeight: "700", color: "#fff" },
  premiumBadge: {
    backgroundColor: "rgba(255,215,0,0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  premiumBadgeText: { color: "#FFD700", fontSize: 11, fontWeight: "700" },
  gymRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  gymText: { color: "#aaa", fontSize: 14 },
  cardBio: { color: "#ccc", fontSize: 14, lineHeight: 20 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "rgba(229,57,53,0.25)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: "#E53935", fontSize: 12, fontWeight: "600" },
  cardActions: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
  },
  actionBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  passBtn: { backgroundColor: "#1a1a1a", borderWidth: 2, borderColor: "#333" },
  likeBtn: { backgroundColor: "#E53935" },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 16 },
  emptyText: { color: "#666", fontSize: 14, marginTop: 8, textAlign: "center" },
  retryBtn: {
    marginTop: 20,
    backgroundColor: "#E53935",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  filterSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  filterTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  filterLabel: { color: "#aaa", fontSize: 13 },
  filterInput: {
    backgroundColor: "#0c0c0c",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  applyBtn: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  clearBtn: { alignItems: "center", padding: 8 },
  clearBtnText: { color: "#666", fontSize: 14 },
  matchOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  matchModal: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  matchEmoji: { fontSize: 60 },
  matchTitle: { fontSize: 32, fontWeight: "800", color: "#fff", marginTop: 12 },
  matchSub: { color: "rgba(255,255,255,0.8)", fontSize: 15, textAlign: "center", marginTop: 8 },
  matchActions: { width: "100%", gap: 12, marginTop: 24 },
  matchChatBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  matchChatBtnText: { color: "#E53935", fontWeight: "700", fontSize: 16 },
  matchSkipBtn: { alignItems: "center", padding: 10 },
  matchSkipBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
});
