"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth, googleAuthProvider } from "@/lib/firebase/client";
import type { Permission, Role } from "@/lib/auth/roles";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: {
    uid: string;
    email?: string;
    displayName?: string | null;
    photoURL?: string | null;
    role: Role | null;
    permissions: Permission[];
  } | null;
  refreshToken: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthState["user"]>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      const tokenResult = await currentUser.getIdTokenResult(true);
      const role = (tokenResult.claims.role ?? null) as Role | null;
      const permissions = (
        tokenResult.claims.permissions ?? []
      ) as Permission[];

      setUser({
        uid: currentUser.uid,
        email: currentUser.email ?? undefined,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        role,
        permissions,
      });

      setStatus("authenticated");
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      refreshToken: async () => {
        const auth = getFirebaseAuth();
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
      },
      signInWithEmail: async (email: string, password: string) => {
        const auth = getFirebaseAuth();
        await signInWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: async () => {
        const auth = getFirebaseAuth();
        await signInWithPopup(auth, googleAuthProvider());
      },
      logout: async () => {
        const auth = getFirebaseAuth();
        await signOut(auth);
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
