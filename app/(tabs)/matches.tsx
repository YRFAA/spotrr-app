import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

type Match = {
  match_id: number;
  matched_at: string;
  other_user_id: number;
  name: string;
  photos: string[] | null;
  gym: string | null;
  conversation_id: number;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: string;
};

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const { data: matches = [], isLoading, error, refetch } = useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: () => apiRequest("/api/matches"),
    refetchInterval: 15000,
  });

  const renderItem = ({ item }: { item: Match }) => {
    const unread = parseInt(item.unread_count || "0") > 0;
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
        onPress={() =>
          router.push({
            pathname: "/chat/[id]",
            params: { id: String(item.conversation_id), name: item.name },
          })
        }
      >
        <LinearGradient colors={["#E53935", "#7B1FA2"]} style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.[0] ?? "?"}</Text>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardTime}>
              {formatTime(item.last_message_at || item.matched_at)}
            </Text>
          </View>
          {item.gym && (
            <Text style={styles.cardGym}><Feather name="activity" size={11} color="#555" /> {item.gym}</Text>
          )}
          <Text
            style={[styles.cardMessage, unread && styles.cardMessageUnread]}
            numberOfLines={1}
          >
            {item.last_message || "Matched! Say hello 👋"}
          </Text>
        </View>

        {unread && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Matches</Text>
        {matches.length > 0 && (
          <Text style={styles.subtitle}>{matches.length} gym {matches.length === 1 ? "buddy" : "buddies"} matched</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color="#444" />
          <Text style={styles.emptyText}>Failed to load matches</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Feather name="heart" size={60} color="#2a2a2a" />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>Keep swiping to find your gym partner!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => String(m.match_id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: botPad, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff" },
  subtitle: { color: "#666", fontSize: 13, marginTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cardTime: { color: "#555", fontSize: 12 },
  cardGym: { color: "#555", fontSize: 12 },
  cardMessage: { color: "#666", fontSize: 13 },
  cardMessageUnread: { color: "#fff", fontWeight: "600" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E53935", flexShrink: 0 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  emptyText: { color: "#666", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: { backgroundColor: "#E53935", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: "#fff", fontWeight: "600" },
});
