'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * Custom hook to get the user's role from our caching system
 * This avoids expensive database lookups on the client side
 */
export function useUserRole() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if auth is not loaded yet or user is not signed in
    if (!isLoaded || !isSignedIn || !userId) {
      setIsLoading(false);
      return;
    }

    async function fetchUserRole() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch role from our API
        const response = await fetch('/api/user-role');
        
        if (!response.ok) {
          throw new Error(`Error fetching user role: ${response.status}`);
        }
        
        const data = await response.json();
        setRole(data.role);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [userId, isLoaded, isSignedIn]);

  // Helper function to check if user is admin
  const isAdmin = role === 'ADMIN';

  return { role, isAdmin, isLoading, error };
} 