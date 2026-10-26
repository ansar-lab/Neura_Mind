import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const PROFILE_STORAGE_KEY = 'neuramind.student_profile';

const DEFAULT_PROFILE = {
  id: 'local-student',
  full_name: 'Student',
  email: 'student@neuramind.app',
  education_level: 'Undergraduate',
};

function getStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (err) {
    console.warn('Could not read student profile from localStorage:', err);
  }
  return DEFAULT_PROFILE;
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(getStoredProfile);

  // Sync to localStorage whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save student profile:', err);
    }
  }, [profile]);

  const user = {
    id: profile.id || 'local-student',
    email: profile.email || 'student@neuramind.app',
    user_metadata: {
      full_name: profile.full_name || 'Student',
      education_level: profile.education_level || 'Undergraduate',
    },
  };

  const session = {
    user,
    access_token: 'local-open-access-token',
  };

  const updateProfile = (updatedFields) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist profile:', err);
      }
      return updated;
    });
  };

  // Mock auth functions ensuring existing callers remain 100% operational
  const signup = async (email, password, fullName, educationLevel) => {
    updateProfile({
      email: email || profile.email,
      full_name: fullName || profile.full_name,
      education_level: educationLevel || profile.education_level,
    });
    return { data: { user }, error: null };
  };

  const login = async (email) => {
    if (email) {
      updateProfile({ email });
    }
    return { data: { user }, error: null };
  };

  const logout = async () => {
    return { error: null };
  };

  const value = {
    session,
    user,
    profile,
    updateProfile,
    loading: false, // Never block with a loading screen
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
