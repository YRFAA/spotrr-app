import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";

type AuthUser = { id: number; email: string };

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("spotrr_token");
        const storedUser = await AsyncStorage.getItem("spotrr_user");
        if (stored && storedUser) {
          setToken(stored);
          setUser(JSON.parse(storedUser));
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await AsyncStorage.setItem("spotrr_token", data.token);
    await AsyncStorage.setItem("spotrr_user", JSON.stringify({ id: data.userId, email }));
    setToken(data.token);
    setUser({ id: data.userId, email });
  };

  const signup = async (email: string, password: string, name: string) => {
    const data = await apiRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    await AsyncStorage.setItem("spotrr_token", data.token);
    await AsyncStorage.setItem("spotrr_user", JSON.stringify({ id: data.userId, email }));
    setToken(data.token);
    setUser({ id: data.userId, email });
    return { isNewUser: data.isNewUser };
  };

  const logout = async () => {
    await AsyncStorage.removeItem("spotrr_token");
    await AsyncStorage.removeItem("spotrr_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
