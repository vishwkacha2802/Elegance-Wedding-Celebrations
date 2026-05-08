import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/api/axios";
import { fetchAdminProfile, updateAdminProfile } from "../services/mockApi";

interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: { name: string; email: string }) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAdminSession = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("vendor");
    sessionStorage.removeItem("elegance_user_session");
    sessionStorage.removeItem("elegance_admin_user");
    sessionStorage.removeItem("elegance_admin_token");
  };

  const hydrateAdminProfile = async () => {
    const profile = await fetchAdminProfile();
    const syncedUser: User = {
      email: profile.email,
      name: profile.name,
      role: profile.role,
    };
    sessionStorage.setItem("elegance_admin_user", JSON.stringify(syncedUser));
    setUser(syncedUser);
    return syncedUser;
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem("elegance_admin_user");
    const storedToken = sessionStorage.getItem("elegance_admin_token");

    const hydrateAdmin = async () => {
      if (storedToken) {
        try {
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser) as User;
            setUser(parsedUser);
          }

          await hydrateAdminProfile();
        } catch {
          clearAdminSession();
          setUser(null);
        }
      }

      setLoading(false);
    };

    hydrateAdmin();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<{
        token?: string;
        accessToken?: string;
        jwt?: string;
        user?: { email?: string; name?: string; role?: string };
      }>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        role: "admin",
      });

      const token = data.token || data.accessToken || data.jwt;
      if (!token) {
        return { success: false, error: "JWT token was not returned by the login API." };
      }

      const userData: User = {
        email: String(data.user?.email || email).trim().toLowerCase(),
        name: String(data.user?.name || "Admin User").trim(),
        role: String(data.user?.role || "admin").trim().toLowerCase(),
      };

      clearAdminSession();
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("elegance_admin_user", JSON.stringify(userData));
      sessionStorage.setItem("elegance_admin_token", token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid email or password",
      };
    }
  };

  const logout = () => {
    clearAdminSession();
    setUser(null);
  };

  const updateProfile = async (updates: { name: string; email: string }) => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const name = updates.name.trim();
    const email = updates.email.trim().toLowerCase();

    if (!name || !email) {
      return { success: false, error: "Name and email are required" };
    }

    try {
      const result = await updateAdminProfile({ name, email });
      if (!result.success) {
        return { success: false, error: "Unable to update profile right now." };
      }

      const updatedUser: User = {
        ...user,
        name,
        email,
      };

      sessionStorage.setItem("elegance_admin_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update profile right now.",
      };
    }
  };

  const refreshProfile = async () => {
    if (!sessionStorage.getItem("elegance_admin_token")) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      await hydrateAdminProfile();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to refresh profile right now.",
      };
    }
  };

  const isAuthenticated = () => {
    return !!user && !!sessionStorage.getItem("elegance_admin_token");
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    refreshProfile,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
