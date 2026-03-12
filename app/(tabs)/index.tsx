import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOCK_USERS = [
  {
    id: "1",
    name: "Alex",
    age: 26,
    distance: "0.5 km",
    gym: "Iron Paradise Gym",
    goals: ["Powerlifting", "Muscle Gain"],
    bio: "Training 5x a week. Looking for a serious lifting partner for morning sessions.",
  },
  {
    id: "2",
    name: "Jordan",
    age: 29,
    distance: "1.2 km",
    gym: "FitZone",
    goals: ["CrossFit", "Endurance"],
    bio: "Competitive CrossFitter. Always down for a WOD partner or running buddy.",
  },
  {
    id: "3",
    name: "Sam",
    age: 24,
    distance: "2.0 km",
    gym: "Planet Fitness",
    goals: ["Weight Loss", "Cardio"],
    bio: "Just started my fitness journey 6 months ago, lost 15kg so far! Looking for accountability.",
  },
];

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const user = MOCK_USERS[currentIndex % MOCK_USERS.length];

  const handleLike = () => setCurrentIndex((i) => i + 1);
  const handlePass = () => setCurrentIndex((i) => i + 1);

  const bg = isDark ? "#0c0c0c" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a1a" : "#fff";
  const textColor = isDark ? "#fff" : "#000";
  const subText = isDark ? "#aaa" : "#666";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.logoRow}>
          <Text style={[styles.logo, { color: "#E53935" }]}>Spotrr</Text>
        </View>
        <Pressable style={styles.filterBtn}>
          <Feather name="sliders" size={22} color={textColor} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <LinearGradient
            colors={["#E53935", "#B71C1C"]}
            style={styles.cardAvatar}
          >
            <Text style={styles.avatarInitial}>{user.name[0]}</Text>
          </LinearGradient>

          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: textColor }]}>
                {user.name}, {user.age}
              </Text>
              <View style={styles.distanceBadge}>
                <Feather name="map-pin" size={12} color="#E53935" />
                <Text style={styles.distanceText}>{user.distance}</Text>
              </View>
            </View>

            <View style={styles.gymRow}>
              <Feather name="activity" size={14} color={subText} />
              <Text style={[styles.gymText, { color: subText }]}>{user.gym}</Text>
            </View>

            <Text style={[styles.bio, { color: subText }]}>{user.bio}</Text>

            <View style={styles.goalsRow}>
              {user.goals.map((goal) => (
                <View key={goal} style={styles.goalTag}>
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handlePass}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.passBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="x" size={28} color="#666" />
            </Pressable>

            <Pressable
              onPress={handleLike}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.likeBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="heart" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.hint, { color: subText }]}>
          {MOCK_USERS.length} gym buddies nearby
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logo: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  filterBtn: { padding: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  cardAvatar: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#fff",
    opacity: 0.9,
  },
  cardInfo: { padding: 20, gap: 10 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { fontSize: 22, fontWeight: "700" },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(229,57,53,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  distanceText: { fontSize: 12, color: "#E53935", fontWeight: "600" },
  gymRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  gymText: { fontSize: 14 },
  bio: { fontSize: 14, lineHeight: 20 },
  goalsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goalTag: {
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  goalText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    padding: 20,
    paddingTop: 0,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  passBtn: { backgroundColor: "#f0f0f0" },
  likeBtn: { backgroundColor: "#E53935" },
  hint: { textAlign: "center", fontSize: 13, marginTop: 4 },
});
