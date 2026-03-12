import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MOCK_MATCHES = [
  {
    id: "1",
    name: "Alex",
    lastMessage: "Want to hit legs tomorrow at 7am?",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    name: "Jordan",
    lastMessage: "Great session today! Same time next week?",
    time: "1h ago",
    unread: false,
  },
  {
    id: "3",
    name: "Sam",
    lastMessage: "Matched with you!",
    time: "3h ago",
    unread: false,
  },
];

export default function MatchesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const bg = isDark ? "#0c0c0c" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a1a" : "#fff";
  const textColor = isDark ? "#fff" : "#000";
  const subText = isDark ? "#aaa" : "#666";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: textColor }]}>Matches</Text>
        <Text style={[styles.subtitle, { color: subText }]}>
          {MOCK_MATCHES.length} gym buddies matched
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_MATCHES.map((match) => (
          <Pressable
            key={match.id}
            style={({ pressed }) => [
              styles.matchCard,
              { backgroundColor: cardBg, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <LinearGradient
              colors={["#E53935", "#B71C1C"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{match.name[0]}</Text>
            </LinearGradient>

            <View style={styles.matchInfo}>
              <View style={styles.matchNameRow}>
                <Text style={[styles.matchName, { color: textColor }]}>{match.name}</Text>
                <Text style={[styles.matchTime, { color: subText }]}>{match.time}</Text>
              </View>
              <Text
                style={[
                  styles.matchMessage,
                  { color: match.unread ? textColor : subText },
                  match.unread && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {match.lastMessage}
              </Text>
            </View>

            {match.unread && <View style={styles.unreadDot} />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  matchInfo: { flex: 1, gap: 4 },
  matchNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchName: { fontSize: 16, fontWeight: "600" },
  matchTime: { fontSize: 12 },
  matchMessage: { fontSize: 14 },
  unreadMessage: { fontWeight: "600" },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
  },
});
