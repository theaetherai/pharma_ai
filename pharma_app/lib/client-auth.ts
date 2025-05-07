/**
 * Client-side auth utilities
 * Safe to import in client components
 */

/**
 * Check if the user has admin role in their JWT
 * This is fast but less authoritative than server-side DB checks
 * 
 * IMPORTANT: This should ONLY be used for UI decisions (showing/hiding elements)
 * All sensitive operations should be protected on the server-side!
 */
export async function checkAdminStatus(): Promise<{
  isAdmin: boolean;
  syncNeeded: boolean;
  message: string;
}> {
  try {
    // Call the admin-check API
    const response = await fetch('/api/admin-check');
    
    if (!response.ok) {
      // Handle error responses
      if (response.status === 401) {
        return {
          isAdmin: false,
          syncNeeded: false,
          message: 'You are not logged in'
        };
      }
      
      return {
        isAdmin: false,
        syncNeeded: false,
        message: 'Error checking admin status'
      };
    }
    
    // Parse the successful response
    const data = await response.json();
    
    return {
      isAdmin: !!data.isAdmin,
      syncNeeded: !!data.syncedJwt,
      message: data.message || ''
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      isAdmin: false,
      syncNeeded: false,
      message: 'Failed to check admin status'
    };
  }
}

/**
 * React hook for checking admin status
 * To be implemented later if needed with useSWR or React Query
 */ 