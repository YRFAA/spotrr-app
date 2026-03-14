import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/revenuecat";

type UserProfile = {
  name: string;
  age: number | null;
  bio: string | null;
  gym: string | null;
  location: string | null;
  goals: string[] | null;
  muscle_groups: string[] | null;
  workout_frequency: string | null;
  availability: string[] | null;
  is_premium: boolean;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { isSubscribed } = useSubscription();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["my-profile"],
    queryFn: () => apiRequest("/api/profile/me"),
  });

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Account",
      "Your profile will be hidden from discovery. You can reactivate by logging in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest("/api/account/deactivate", { method: "POST" });
              await logout();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to deactivate account");
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest("/api/account/delete", { method: "DELETE" });
              await logout();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  const settingRows = [
    { icon: "edit-2", label: "Edit Profile", route: "/settings/edit-profile" as const },
    { icon: "sliders", label: "Preferences", route: "/settings/preferences" as const },
    { icon: "bell", label: "Notifications", route: "/settings/notifications" as const },
    { icon: "shield", label: "Privacy", route: "/settings/privacy" as const },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  const name = profile?.name || "Your Profile";
  const goals = profile?.goals || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad, paddingTop: topPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient colors={["#E53935", "#7B1FA2"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{name[0] ?? "?"}</Text>
          </LinearGradient>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{name}{profile?.age ? `, ${profile.age}` : ""}</Text>
            {profile?.gym && (
              <Text style={styles.gymText}>
                <Feather name="activity" size={13} color="#666" /> {profile.gym}
              </Text>
            )}
            {profile?.location && (
              <Text style={styles.gymText}>
                <Feather name="map-pin" size={13} color="#666" /> {profile.location}
              </Text>
            )}
          </View>
          {(isSubscribed || profile?.is_premium) && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
            </View>
          )}
        </View>

        {/* Premium Banner */}
        {!isSubscribed && !profile?.is_premium && (
          <Pressable
            style={styles.premiumBanner}
            onPress={() => router.push("/premium")}
          >
            <LinearGradient
              colors={["#E53935", "#7B1FA2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumBannerGrad}
            >
              <View style={styles.premiumBannerContent}>
                <Feather name="star" size={20} color="#FFD700" />
                <View>
                  <Text style={styles.premiumBannerTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumBannerSub}>Unlimited likes · See who liked you</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Bio */}
        {profile?.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
            </View>
            <View style={styles.tagsRow}>
              {goals.map((g) => (
                <View key={g} style={styles.tag}>
                  <Text style={styles.tagText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Workout Details */}
        {(profile?.workout_frequency || (profile?.availability?.length ?? 0) > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            {profile?.workout_frequency && (
              <View style={styles.detailRow}>
                <Feather name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>{profile.workout_frequency}</Text>
              </View>
            )}
            {(profile?.availability?.length ?? 0) > 0 && (
              <View style={styles.tagsRow}>
                {profile!.availability!.map((a) => (
                  <View key={a} style={styles.availChip}>
                    <Text style={styles.availChipText}>{a.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          {settingRows.map((item, i) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.settingRow,
                i < settingRows.length - 1 && styles.settingRowBorder,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <Feather name={item.icon as any} size={18} color="#666" />
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color="#444" style={{ marginLeft: "auto" }} />
            </Pressable>
          ))}
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.settingRow, styles.settingRowBorder, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#E53935" />
            <Text style={[styles.settingLabel, { color: "#E53935" }]}>Sign Out</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.settingRow, styles.settingRowBorder, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleDeactivate}
          >
            <Feather name="pause-circle" size={18} color="#FF9800" />
            <Text style={[styles.settingLabel, { color: "#FF9800" }]}>Deactivate Account</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={18} color="#666" />
            <Text style={[styles.settingLabel, { color: "#666" }]}>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  center: { alignItems: "center", justifyContent: "center" },
  profileHeader: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 34, fontWeight: "700" },
  nameBlock: { flex: 1, gap: 4 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  gymText: { color: "#666", fontSize: 13 },
  premiumBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  premiumBadgeText: { color: "#FFD700", fontSize: 12, fontWeight: "700" },
  premiumBanner: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: "hidden" },
  premiumBannerGrad: { padding: 16 },
  premiumBannerContent: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  premiumBannerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  premiumBannerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  bioSection: { paddingHorizontal: 20, marginBottom: 8 },
  bio: { color: "#aaa", fontSize: 14, lineHeight: 20 },
  section: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "rgba(229,57,53,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { color: "#E53935", fontSize: 13, fontWeight: "600" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { color: "#aaa", fontSize: 14 },
  availChip: { backgroundColor: "#2a2a2a", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  availChipText: { color: "#aaa", fontSize: 12 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  settingRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2a2a2a" },
  settingLabel: { color: "#fff", fontSize: 15 },
});
