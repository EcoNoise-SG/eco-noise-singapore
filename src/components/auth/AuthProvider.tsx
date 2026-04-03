"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

type MockUser = {
  id: string;
  email: string;
  last_sign_in_at?: string;
  user_metadata?: {
    full_name?: string;
    agency?: string;
  };
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  user: MockUser | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Authentication request failed.";
}

function isInvalidCredentialsError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    message.includes("email not confirmed") ||
    message.includes("user not found")
  );
}

function isExistingUserError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("already registered") ||
    message.includes("user already registered") ||
    message.includes("already been registered")
  );
}

const selfSignupEnabled = process.env.NEXT_PUBLIC_ENABLE_SELF_SIGNUP === "true";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && isMounted) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          last_sign_in_at: session.user.last_sign_in_at,
          user_metadata: session.user.user_metadata,
        });
      }

      if (isMounted) {
        setIsReady(true);
      }
    }

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          last_sign_in_at: session.user.last_sign_in_at,
          user_metadata: session.user.user_metadata,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, _password?: string) {
    try {
      // Validate inputs
      if (!email) {
        throw new Error("Email is required.");
      }

      const password = _password || "";
      if (!password) {
        throw new Error("Password is required.");
      }

      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInResult.error && signInResult.data.user) {
        setUser({
          id: signInResult.data.user.id,
          email: signInResult.data.user.email || email,
          last_sign_in_at: signInResult.data.user.last_sign_in_at,
          user_metadata: signInResult.data.user.user_metadata,
        });
        toast.success(`Welcome ${signInResult.data.user.user_metadata?.full_name || email.split('@')[0]}!`);
        return;
      }

      if (signInResult.error && isInvalidCredentialsError(signInResult.error) && selfSignupEnabled) {
        const signUpResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split("@")[0],
              agency:
                email.includes('gov') || email.includes('mom') || email.includes('bca') || email.includes('nea')
                  ? "Government Agency"
                  : "Authorized Partner",
            },
          },
        });

        if (!signUpResult.error && signUpResult.data.user) {
          if (signUpResult.data.session) {
            setUser({
              id: signUpResult.data.user.id,
              email: signUpResult.data.user.email || email,
              last_sign_in_at: signUpResult.data.user.last_sign_in_at,
              user_metadata: signUpResult.data.user.user_metadata,
            });
            toast.success(`Account created and signed in as ${signUpResult.data.user.user_metadata?.full_name || email.split('@')[0]}!`);
            return;
          }

          const retrySignIn = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!retrySignIn.error && retrySignIn.data.user) {
            setUser({
              id: retrySignIn.data.user.id,
              email: retrySignIn.data.user.email || email,
              last_sign_in_at: retrySignIn.data.user.last_sign_in_at,
              user_metadata: retrySignIn.data.user.user_metadata,
            });
            toast.success(`Account created and signed in as ${retrySignIn.data.user.user_metadata?.full_name || email.split('@')[0]}!`);
            return;
          }

          toast.success("Account created. Check your email if confirmation is required before sign-in.");
          return;
        }

        if (signUpResult.error && isExistingUserError(signUpResult.error)) {
          throw new Error("This account already exists. Double-check the password and try again.");
        }

        if (signUpResult.error) {
          throw signUpResult.error;
        }
      }

      if (signInResult.error && isInvalidCredentialsError(signInResult.error) && !selfSignupEnabled) {
        throw new Error("Invalid credentials. If you do not have an account yet, use Request Access first.");
      }

      throw signInResult.error || new Error("Authentication could not be completed for this account.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
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
