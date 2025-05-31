"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

type User = {
  email: string;
  authenticated: boolean;
  loginTime: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData.authenticated) {
          setUser(sessionData);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh auth state
  const refreshAuth = async () => {
    await checkAuth();
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await signOutAction();
      if (result.success) {
        setUser(null);
        console.log('Sign out successful - redirecting to login');
        router.push('/login');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
