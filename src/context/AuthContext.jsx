import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, rejection_reason, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[profile] fetch error', error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    role: data.role,
    status: data.status,
    rejectionReason: data.rejection_reason,
    createdAt: data.created_at,
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole]       = useState(null);
  const [userStatus, setUserStatus]   = useState(null);
  const [userData, setUserData]       = useState(null);
  const [loading, setLoading]         = useState(true);

  async function applySession(session) {
    const user = session?.user || null;
    if (!user) {
      setCurrentUser(null);
      setUserRole(null);
      setUserStatus(null);
      setUserData(null);
      return;
    }

    // Adaptamos el usuario para que tenga shape similar al de Firebase (.uid)
    setCurrentUser({ id: user.id, uid: user.id, email: user.email });

    const profile = await fetchProfile(user.id);
    if (profile) {
      setUserRole(profile.role);
      setUserStatus(profile.status);
      setUserData(profile);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await applySession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      await applySession(session);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function register(fullName, email, password, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) throw error;

    // El trigger handle_new_user crea el row en profiles.
    // Por si la session ya esta lista, aplicamos:
    if (data?.session) {
      await applySession(data.session);
    } else if (data?.user) {
      // Si email confirmation esta activado, no hay session aun
      setCurrentUser({ id: data.user.id, uid: data.user.id, email: data.user.email });
      setUserRole(role);
      setUserStatus(role === 'buyer' ? 'approved' : 'pending');
    }
    return data;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (!currentUser) return;
    const profile = await fetchProfile(currentUser.id);
    if (profile) {
      setUserRole(profile.role);
      setUserStatus(profile.status);
      setUserData(profile);
    }
  }

  const value = {
    currentUser,
    userRole,
    userStatus,
    userData,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
