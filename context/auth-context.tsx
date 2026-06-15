"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface DbUser {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase Auth user with public.users table
  const syncUser = async (authUser: User) => {
    if (!authUser.email) return null;
    
    try {
      // 1. Try to find the user in the public.users table
      const { data: existingUsers, error: fetchError } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("email", authUser.email);

      if (fetchError) {
        console.error("Error fetching db user:", fetchError);
        return null;
      }

      if (existingUsers && existingUsers.length > 0) {
        return existingUsers[0] as DbUser;
      }

      // 2. If user doesn't exist, create a new record
      const defaultName = authUser.user_metadata?.full_name || authUser.email.split("@")[0];
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ email: authUser.email, name: defaultName }])
        .select("id, email, name")
        .single();

      if (insertError) {
        console.error("Error inserting new db user:", insertError);
        return null;
      }

      return newUser as DbUser;
    } catch (err) {
      console.error("Unexpected error syncing user:", err);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const synced = await syncUser(session.user);
          setDbUser(synced);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const synced = await syncUser(session.user);
          setDbUser(synced);
        } else {
          setUser(null);
          setDbUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDbUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
