'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '@/lib/monitoring';
import { processQueue } from '@/lib/operation-queue';
import { toast } from 'sonner';

export function ResilienceInit() {
  useEffect(() => {
    // Initialize error handling
    setupGlobalErrorHandling();
    
    // Process any queued operations on startup
    processQueue().catch(console.error);
    
    // Set up network status handlers
    const handleOnline = () => {
      toast.success('Connection restored. Processing pending operations...');
      processQueue().catch(console.error);
    };
    
    const handleOffline = () => {
      toast.warning('Connection lost. Your actions will be saved and processed when connection is restored.');
    };
    
    // Register network event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial network status check
    if (!navigator.onLine) {
      toast.warning('You are currently offline. Some features may be limited.');
    }
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}