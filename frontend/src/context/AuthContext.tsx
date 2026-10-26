"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUser, UserRole } from "../types/index";
import { api } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS = {
  AUTHOR: {
    email: "priya.sharma@email.com",
    password: "Author@123",
    label: "Priya Sharma (Author)",
  },
  ADMIN: {
    email: "admin@bookleaf.com",
    password: "Admin@123",
    label: "Operations Admin",
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authenticate with specific credentials
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.data) {
        localStorage.setItem("bookleaf_token", res.data.token);
        localStorage.setItem("bookleaf_user", JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bookleaf_token");
    localStorage.removeItem("bookleaf_user");
    setToken(null);
    setUser(null);
  }, []);

  // Quick switcher for demo review (Author <-> Admin)
  const switchDemoUser = useCallback(
    async (role: UserRole) => {
      const creds = DEMO_CREDENTIALS[role];
      await login(creds.email, creds.password);
    },
    [login]
  );

  // Initial session hydration
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("bookleaf_token");
      const storedUser = localStorage.getItem("bookleaf_user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Refresh user profile in background
          const me = await api.auth.getMe();
          if (me.success && me.data) {
            setUser(me.data);
            localStorage.setItem("bookleaf_user", JSON.stringify(me.data));
          }
        } catch {
          // Token expired or invalid, clear session
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [switchDemoUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
