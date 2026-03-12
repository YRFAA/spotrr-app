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

const MY_GOALS = ["Powerlifting", "Muscle Gain", "Consistency"];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const bg = isDark ? "#0c0c0c" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a1a" : "#fff";
  const textColor = isDark ? "#fff" : "#000";
  const subText = isDark ? "#aaa" : "#666";

  const stats = [
    { label: "Matches", value: "12" },
    { label: "Workouts", value: "48" },
    { label: "Streak", value: "7d" },
  ];

  const settingsItems = [
    { icon: "edit-2", label: "Edit Profile" },
    { icon: "settings", label: "Preferences" },
    { icon: "bell", label: "Notifications" },
    { icon: "shield", label: "Privacy" },
    { icon: "log-out", label: "Sign Out" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad, paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <LinearGradient colors={["#E53935", "#B71C1C"]} style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </LinearGradient>
          <Text style={[styles.name, { color: textColor }]}>Me</Text>
          <Text style={[styles.gym, { color: subText }]}>
            <Feather name="activity" size={13} color={subText} /> Iron Paradise Gym
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#E53935" }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: subText }]}>{stat.label}</Text>
              </View>
              {i < stats.length - 1 && (
                <View style={[styles.statDivider, { backgroundColor: isDark ? "#333" : "#eee" }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>My Goals</Text>
          <View style={styles.goalsRow}>
            {MY_GOALS.map((goal) => (
              <View key={goal} style={styles.goalTag}>
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          {settingsItems.map((item, i) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.settingRow,
                i < settingsItems.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: isDark ? "#333" : "#eee",
                },
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name={item.icon as any} size={18} color={item.label === "Sign Out" ? "#E53935" : subText} />
              <Text
                style={[
                  styles.settingLabel,
                  { color: item.label === "Sign Out" ? "#E53935" : textColor },
                ]}
              >
                {item.label}
              </Text>
              {item.label !== "Sign Out" && (
                <Feather name="chevron-right" size={16} color={subText} style={{ marginLeft: "auto" }} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  profileHeader: { alignItems: "center", paddingVertical: 24, gap: 8 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "700" },
  name: { fontSize: 24, fontWeight: "700" },
  gym: { fontSize: 14 },
  statsCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  section: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  goalsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goalTag: {
    backgroundColor: "#E53935",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 15 },
});
