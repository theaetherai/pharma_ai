import { setupGlobalErrorHandling, logger } from './monitoring';
import { processQueue } from './operation-queue';

let initialized = false;

/**
 * Initialize resilience features for the application
 * - Sets up global error handling
 * - Processes any queued operations from previous sessions
 * - Sets up listeners for online/offline events
 */
export function initializeResilience() {
  // Only initialize once
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  
  logger.info('resilience', 'Initializing resilience features');
  
  // Set up global error handlers
  setupGlobalErrorHandling();
  
  // Process any queued operations from previous sessions
  processQueue().catch(err => {
    logger.error('resilience', 'Failed to process operation queue on startup', err);
  });
  
  // Set up online/offline handlers
  const handleOnline = () => {
    logger.info('network', 'Connection restored');
    processQueue().catch(err => {
      logger.error('resilience', 'Failed to process operation queue after reconnect', err);
    });
  };
  
  const handleOffline = () => {
    logger.warn('network', 'Connection lost');
  };
  
  // Register listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Log initial state
  if (!navigator.onLine) {
    logger.warn('network', 'Application started in offline mode');
  }
  
  logger.info('resilience', 'Resilience features initialized successfully');
}

// Auto-initialize in browser environments
if (typeof window !== 'undefined') {
  // Delay initialization slightly to allow application to load first
  setTimeout(() => {
    initializeResilience();
  }, 100);
} 