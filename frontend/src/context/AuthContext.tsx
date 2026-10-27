"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUser } from "../types/index";
import { api } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.data) {
        sessionStorage.setItem("bookleaf_token", res.data.token);
        sessionStorage.setItem("bookleaf_user", JSON.stringify(res.data.user));
        localStorage.setItem("bookleaf_token", res.data.token);
        localStorage.setItem("bookleaf_user", JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        throw new Error((res as any)?.message || "Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("bookleaf_token");
    sessionStorage.removeItem("bookleaf_user");
    localStorage.removeItem("bookleaf_token");
    localStorage.removeItem("bookleaf_user");
    setToken(null);
    setUser(null);
  }, []);

  // Initial session hydration
  useEffect(() => {
    const initAuth = async () => {
      const storedToken =
        sessionStorage.getItem("bookleaf_token") || localStorage.getItem("bookleaf_token");
      const storedUser =
        sessionStorage.getItem("bookleaf_user") || localStorage.getItem("bookleaf_user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const me = await api.auth.getMe();
          if (me.success && me.data) {
            setUser(me.data);
            sessionStorage.setItem("bookleaf_user", JSON.stringify(me.data));
            localStorage.setItem("bookleaf_user", JSON.stringify(me.data));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
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
