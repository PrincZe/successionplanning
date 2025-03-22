"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Mock user data for prototype
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'demo@example.com',
  user_metadata: {
    name: 'Demo User'
  }
};

type AuthContextType = {
  user: any;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: MOCK_USER,
  session: { user: MOCK_USER },
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In prototype mode, we'll always have a "logged in" user
  const [user] = useState(MOCK_USER);
  const [session] = useState({ user: MOCK_USER });
  const [loading] = useState(false);
  const router = useRouter();

  // Simplified sign out for prototype
  const signOut = async () => {
    console.log('Sign out clicked - in prototype mode, this does nothing');
    // In a prototype, we could redirect to home page
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
