import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/lib/api";

const GOALS_OPTIONS = ["Muscle Gain", "Fat Loss", "Endurance", "Powerlifting", "CrossFit", "Calisthenics", "Flexibility", "General Fitness"];
const MUSCLE_OPTIONS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Glutes", "Core", "Full Body"];
const AVAILABILITY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FREQUENCY_OPTIONS = ["2x a week", "3x a week", "4x a week", "5x a week", "6x a week", "Daily"];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    bio: "",
    gym: "",
    location: "",
    age: "",
    workout_frequency: "",
    goals: [] as string[],
    muscle_groups: [] as string[],
    availability: [] as string[],
  });

  const toggleItem = (field: "goals" | "muscle_groups" | "availability", item: string) => {
    setProfile((p) => {
      const arr = p[field];
      return {
        ...p,
        [field]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiRequest("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          ...profile,
          age: profile.age ? parseInt(profile.age) : undefined,
        }),
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "About You",
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.fieldLabel}>Age</Text>
          <TextInput
            style={styles.input}
            value={profile.age}
            onChangeText={(t) => setProfile((p) => ({ ...p, age: t.replace(/\D/g, "") }))}
            placeholder="Your age"
            placeholderTextColor="#555"
            keyboardType="numeric"
          />
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(t) => setProfile((p) => ({ ...p, bio: t }))}
            placeholder="Tell gym buddies about yourself..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.fieldLabel}>Location / City</Text>
          <TextInput
            style={styles.input}
            value={profile.location}
            onChangeText={(t) => setProfile((p) => ({ ...p, location: t }))}
            placeholder="e.g. New York, NY"
            placeholderTextColor="#555"
          />
        </View>
      ),
    },
    {
      title: "Your Gym",
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.fieldLabel}>Gym Name</Text>
          <TextInput
            style={styles.input}
            value={profile.gym}
            onChangeText={(t) => setProfile((p) => ({ ...p, gym: t }))}
            placeholder="e.g. Planet Fitness, Gold's Gym..."
            placeholderTextColor="#555"
          />
          <Text style={styles.fieldLabel}>Training Frequency</Text>
          <View style={styles.chipGrid}>
            {FREQUENCY_OPTIONS.map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, profile.workout_frequency === f && styles.chipActive]}
                onPress={() => setProfile((p) => ({ ...p, workout_frequency: f }))}
              >
                <Text style={[styles.chipText, profile.workout_frequency === f && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    },
    {
      title: "Your Goals",
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.fieldLabel}>Select all that apply</Text>
          <View style={styles.chipGrid}>
            {GOALS_OPTIONS.map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, profile.goals.includes(g) && styles.chipActive]}
                onPress={() => toggleItem("goals", g)}
              >
                <Text style={[styles.chipText, profile.goals.includes(g) && styles.chipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    },
    {
      title: "Focus Areas",
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.fieldLabel}>Muscle groups you train</Text>
          <View style={styles.chipGrid}>
            {MUSCLE_OPTIONS.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, profile.muscle_groups.includes(m) && styles.chipActive]}
                onPress={() => toggleItem("muscle_groups", m)}
              >
                <Text style={[styles.chipText, profile.muscle_groups.includes(m) && styles.chipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Availability</Text>
          <View style={styles.chipGrid}>
            {AVAILABILITY_OPTIONS.map((a) => (
              <Pressable
                key={a}
                style={[styles.chip, profile.availability.includes(a) && styles.chipActive]}
                onPress={() => toggleItem("availability", a)}
              >
                <Text style={[styles.chipText, profile.availability.includes(a) && styles.chipTextActive]}>{a.slice(0,3)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepCount}>{step + 1} / {steps.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{steps[step].title}</Text>
        {steps[step].content}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step > 0 && (
          <Pressable
            style={styles.backBtn}
            onPress={() => setStep((s) => s - 1)}
          >
            <Feather name="arrow-left" size={20} color="#aaa" />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.nextBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
          onPress={isLast ? handleComplete : () => setStep((s) => s + 1)}
          disabled={loading}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? (loading ? "Saving..." : "Start Spotting!") : "Next"}
          </Text>
          {!isLast && <Feather name="arrow-right" size={18} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  progressBar: { flex: 1, flexDirection: "row", gap: 6 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2a2a2a",
  },
  progressDotActive: { backgroundColor: "#E53935" },
  stepCount: { color: "#666", fontSize: 13 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  stepTitle: { fontSize: 26, fontWeight: "700", color: "#fff", marginBottom: 24 },
  stepContent: { gap: 16 },
  fieldLabel: { color: "#aaa", fontSize: 13, fontWeight: "500" },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
  },
  chipActive: { backgroundColor: "#E53935", borderColor: "#E53935" },
  chipText: { color: "#888", fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#0c0c0c",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#E53935",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
