// components/auth/AuthInitializer.tsx
"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { user, fetchCurrentUser, isLoading } = useAuthStore()
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if already initialized to prevent multiple calls if component somehow re-mounts.
    // Also check if there's a user already (e.g. after login redirect).
    if (!initialized && !user) {
      fetchCurrentUser().finally(() => {
        setInitialized(true);
        console.log("AuthInitializer: fetchCurrentUser completed.");
      });
    } else {
      setInitialized(true) // Already initialized or user exists
      if(user) console.log("AuthInitializer: User already in store.");
    }
  }, [fetchCurrentUser, initialized, user]);

  // Optional: Show a global loading spinner while initializing if desired,
  // but the primary goal is to populate the store for Sidebar.
  // The Sidebar itself will handle its own loading state.
  // if (!initialized && isLoading) {
  //   return <div>Loading application...</div>; // Or a proper global spinner
  // }

  return <>{children}</>;
}
