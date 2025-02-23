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
    let mounted = true;
    let navigationTimeout: NodeJS.Timeout;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        console.log('Initial session check:', session ? 'authenticated' : 'not authenticated');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Handle navigation based on session
        if (session?.user) {
          const isAuthPage = pathname === '/login' || pathname === '/auth/callback';
          if (isAuthPage) {
            console.log('Session found on auth page, redirecting to home');
            router.replace('/home');
          }
        } else {
          const isProtectedRoute = !['/', '/login', '/auth/callback'].includes(pathname);
          if (isProtectedRoute && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
            console.log('No session found on protected route, redirecting to login');
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      console.log('Auth state change:', event, currentSession ? 'authenticated' : 'not authenticated');
      
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }

      // Clear any pending navigation timeouts
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }

      // Handle navigation based on auth state
      if (event === 'SIGNED_IN') {
        console.log('User signed in, waiting for session establishment...');
        
        // Wait for session to be fully established
        let retries = 0;
        const maxRetries = 3;
        let sessionEstablished = false;

        while (retries < maxRetries && !sessionEstablished && mounted) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error checking session:', error);
            break;
          }

          if (session?.access_token && session?.refresh_token) {
            console.log('Session fully established, proceeding with navigation');
            sessionEstablished = true;
            
            // Set a timeout to ensure we don't navigate too early
            navigationTimeout = setTimeout(() => {
              if (mounted) {
                console.log('Navigating to home after session establishment');
                router.replace('/home');
              }
            }, 500);
            
            break;
          }

          retries++;
          if (retries < maxRetries) {
            console.log(`Session not ready, retry ${retries}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!sessionEstablished) {
          console.error('Failed to establish session after maximum retries');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        router.replace('/login');
      }
    });

    return () => {
      mounted = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
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
