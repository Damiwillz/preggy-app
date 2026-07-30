import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { disableGuestMode, enableGuestMode, isGuestMode } from '@/services/guest';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  startGuestMode: () => Promise<void>;
  stopGuestMode: () => Promise<void>;
};

async function noop() {}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
  startGuestMode: noop,
  stopGuestMode: noop,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([supabase.auth.getSession(), isGuestMode()])
      .then(([{ data }, guestEnabled]) => {
        if (!mounted) return;

        setSession(data.session);
        setIsGuest(!data.session && guestEnabled);
        setLoading(false);
      })
      .catch((error) => {
        console.log('Auth load error:', error);

        if (!mounted) return;

        setSession(null);
        setIsGuest(false);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        setIsGuest(false);
        void disableGuestMode();
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const startGuestMode = useCallback(async () => {
    await enableGuestMode();

    setSession(null);
    setIsGuest(true);
    setLoading(false);
  }, []);

  const stopGuestMode = useCallback(async () => {
    await disableGuestMode();

    setIsGuest(false);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isGuest,
      startGuestMode,
      stopGuestMode,
    }),
    [session, loading, isGuest, startGuestMode, stopGuestMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
