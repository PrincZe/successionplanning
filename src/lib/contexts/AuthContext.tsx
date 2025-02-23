"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'authenticated' : 'not authenticated');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      console.log('Auth state change:', event, session ? 'authenticated' : 'not authenticated');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle navigation based on auth state
      if (event === 'SIGNED_IN') {
        console.log('User signed in, redirecting to home');
        router.replace('/home');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Handle protected routes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthPage = pathname === '/login' || pathname === '/auth/callback';
      
      if (!session && !isAuthPage && pathname !== '/') {
        console.log('No session found, redirecting to login from:', pathname);
        router.replace('/login');
      } else if (session && isAuthPage) {
        console.log('Session found on auth page, redirecting to home');
        router.replace('/home');
      }
    };

    checkAuth();
  }, [pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
