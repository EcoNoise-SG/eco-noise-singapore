"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password?: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password', // Defaulting for the demo if user doesn't provide it
      });

      if (error) {
        // Fallback for new users (auto-registration)
        if (error.message.includes("Invalid login credentials") || error.status === 400) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password: password || 'password',
            options: {
              data: {
                full_name: email.split('@')[0],
                agency: email.includes('gov') ? "NEA · Enforcement" : "EcoNoise SG Pilot"
              }
            }
          });

          if (signUpError) {
             if (signUpError.message.includes("User already registered")) {
                throw new Error("Incorrect password for this email.");
             }
             if (signUpError.message.includes("Database error saving new user")) {
                throw new Error("Supabase internal error. Please ensure 'Confirm Email' is disabled in Supabase > Authentication > Settings.");
             }
             throw signUpError;
          }
          toast.success("New account provisioned!");
          return;
        }
        throw error;
      }
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
      throw error;
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  }

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated: !!user, 
        isReady, 
        user, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
