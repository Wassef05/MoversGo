import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api/authService";
import { localStorageService } from "../services/storage/localStorageService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem("moveflow_tn_token");
      if (token) {
        try {
          const user = await authService.getMe();
          if (user) {
            setCurrentUser(user);
            localStorageService.set(localStorageService.KEYS.CURRENT_USER, user);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Session check failed, clearing token:", err.message);
          localStorage.removeItem("moveflow_tn_token");
          localStorageService.remove(localStorageService.KEYS.CURRENT_USER);
        }
      }

      // No valid backend session -> unauthenticated
      setCurrentUser(null);
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email, password, role) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password, role);
      if (result?.user) {
        setCurrentUser(result.user);
        localStorageService.set(localStorageService.KEYS.CURRENT_USER, result.user);
        setIsLoading(false);
        return result.user;
      }
      throw new Error("Réponse de connexion invalide");
    } catch (apiErr) {
      setIsLoading(false);
      const errMsg = apiErr.response?.data?.message || apiErr.message || "Adresse email ou mot de passe incorrect.";
      throw new Error(errMsg);
    }
  };

  const loginWithGoogle = async (googleData) => {
    setIsLoading(true);
    try {
      const result = await authService.googleAuth(googleData);
      if (result?.user) {
        setCurrentUser(result.user);
        localStorageService.set(localStorageService.KEYS.CURRENT_USER, result.user);
        setIsLoading(false);
        return result.user;
      }
      throw new Error("Réponse de connexion Google invalide");
    } catch (apiErr) {
      setIsLoading(false);
      const errMsg = apiErr.response?.data?.message || apiErr.message || "Erreur lors de la connexion avec Google.";
      throw new Error(errMsg);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const result = await authService.register(userData);
      if (result?.user) {
        setCurrentUser(result.user);
        localStorageService.set(localStorageService.KEYS.CURRENT_USER, result.user);
        setIsLoading(false);
        return result.user;
      }
      throw new Error("Réponse d'inscription invalide");
    } catch (apiErr) {
      setIsLoading(false);
      throw new Error(apiErr.response?.data?.message || apiErr.message || "Erreur lors de l'inscription.");
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setCurrentUser(null);
      localStorageService.remove(localStorageService.KEYS.CURRENT_USER);
      localStorage.removeItem("moveflow_tn_token");
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await authService.updateProfile(updates);
      const user = res?.data?.user || res?.user;
      const token = res?.data?.token || res?.token;
      if (token) {
        localStorage.setItem("moveflow_tn_token", token);
      }
      if (user) {
        setCurrentUser(user);
        localStorageService.set(localStorageService.KEYS.CURRENT_USER, user);
        return user;
      }
      return res;
    } catch (err) {
      console.warn("Could not sync profile update to backend:", err.message);
      throw err;
    }
  };

  const setCurrentUserDirectly = (user) => {
    setCurrentUser(user);
    localStorageService.set(localStorageService.KEYS.CURRENT_USER, user);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    role: currentUser?.role || null,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    setCurrentUserDirectly,
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
