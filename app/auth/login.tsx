import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <Text style={styles.logo}>Spotrr</Text>
          <Text style={styles.tagline}>Find your perfect gym partner</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passWrapper}>
            <TextInput
              style={[styles.input, styles.passInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor="#555"
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPass((s) => !s)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color="#666" />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, { opacity: pressed || loading ? 0.8 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "Logging in..." : "Log In"}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/auth/signup")} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchLink}>Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0c0c0c" },
  container: { flexGrow: 1, paddingHorizontal: 28 },
  logoSection: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 48, fontWeight: "800", color: "#E53935", letterSpacing: -2 },
  tagline: { color: "#666", fontSize: 15, marginTop: 8 },
  form: { gap: 12 },
  label: { color: "#aaa", fontSize: 13, fontWeight: "500", marginBottom: -4 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  passWrapper: { position: "relative" },
  passInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 16, top: 18 },
  btn: {
    backgroundColor: "#E53935",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchBtn: { alignItems: "center", marginTop: 12 },
  switchText: { color: "#666", fontSize: 14 },
  switchLink: { color: "#E53935", fontWeight: "600" },
});
