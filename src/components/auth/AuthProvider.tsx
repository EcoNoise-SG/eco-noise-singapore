"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type User = {
  name: string;
  role: string;
  agency: string;
};

type AuthSession = {
  user: User;
  issuedAt: string;
  version: number;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "eco-noise-sg-auth";
const SESSION_VERSION = 1;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.agency === "string"
  );
}

function parseStoredSession(value: string | null): User | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AuthSession | User;

    if (
      parsed &&
      typeof parsed === "object" &&
      "user" in parsed &&
      isUser(parsed.user)
    ) {
      return parsed.user;
    }

    if (isUser(parsed)) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const restoreSession = (storedValue: string | null) => {
      const nextUser = parseStoredSession(storedValue);

      setUser(nextUser);
      setIsAuthenticated(Boolean(nextUser));
      setIsReady(true);
    };

    restoreSession(window.localStorage.getItem(STORAGE_KEY));

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      restoreSession(event.newValue);
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function login(email: string) {
    const nextUser: User = {
      name: "Operations Analyst",
      role: "Enforcement Planning",
      agency: email.includes("gov") ? "GovTech / NEA" : "EcoNoise SG Pilot",
    };
    const nextSession: AuthSession = {
      user: nextUser,
      issuedAt: new Date().toISOString(),
      version: SESSION_VERSION,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setUser(nextUser);
    setIsAuthenticated(true);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isReady, user, login, logout }}
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
