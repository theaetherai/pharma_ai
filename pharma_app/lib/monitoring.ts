/**
 * Monitoring and logging utility for tracking errors and application health
 */

// Configuration
const MAX_LOGS = 100;
const LOG_PERSISTENCE_ENABLED = true;

// Log types
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Log entry structure
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
  userId?: string;
}

// In-memory log storage
const logs: LogEntry[] = [];

/**
 * Log a message to the monitoring system
 */
export function logEvent(
  level: LogLevel,
  category: string,
  message: string,
  details?: any,
  userId?: string
): void {
  const logEntry: LogEntry = {
    timestamp: Date.now(),
    level,
    category,
    message,
    details,
    userId
  };
  
  // Add to in-memory logs
  logs.unshift(logEntry);
  
  // Trim logs if needed
  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS;
  }
  
  // Log to console for development
  const consoleMethod = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    critical: console.error,
  }[level] || console.log;
  
  consoleMethod(`[${level.toUpperCase()}][${category}] ${message}`, details);
  
  // Persist logs if enabled and in browser environment
  if (LOG_PERSISTENCE_ENABLED && typeof window !== 'undefined') {
    persistLog(logEntry).catch(error => {
      console.error('Failed to persist log:', error);
    });
  }
  
  // For critical errors, consider sending immediate notifications
  if (level === 'critical') {
    // This could send an alert via email/SMS in production
    console.error('CRITICAL ERROR:', message, details);
  }
}

/**
 * Persist a log entry to storage
 */
async function persistLog(logEntry: LogEntry): Promise<void> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Store in IndexedDB for browser clients
    const { setCacheItem } = await import('./idb-storage');
    const storageKey = `log_${logEntry.timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    await setCacheItem(storageKey, logEntry, 86400 * 7); // Store for 7 days
    
    // In a production system, would also send to a proper logging service
  } catch (error) {
    console.error('Error persisting log:', error);
  }
}

/**
 * Helper functions for common log levels
 */
export const logger = {
  debug: (category: string, message: string, details?: any, userId?: string) => 
    logEvent('debug', category, message, details, userId),
    
  info: (category: string, message: string, details?: any, userId?: string) => 
    logEvent('info', category, message, details, userId),
    
  warn: (category: string, message: string, details?: any, userId?: string) => 
    logEvent('warn', category, message, details, userId),
    
  error: (category: string, message: string, details?: any, userId?: string) => 
    logEvent('error', category, message, details, userId),
    
  critical: (category: string, message: string, details?: any, userId?: string) => 
    logEvent('critical', category, message, details, userId),
}

/**
 * Track application health metrics
 */
export const metrics = {
  apiCalls: {
    total: 0,
    success: 0,
    failed: 0,
    timeouts: 0,
  },
  
  payments: {
    attempted: 0,
    success: 0,
    failed: 0,
    queued: 0,
  },
  
  networkStatus: {
    lastOnline: Date.now(),
    connectionDrops: 0,
  },
  
  prescription: {
    generated: 0,
    downloaded: 0,
    failed: 0,
  },
  
  recordApiCall(success: boolean, timeout = false): void {
    this.apiCalls.total++;
    if (success) {
      this.apiCalls.success++;
    } else {
      this.apiCalls.failed++;
      if (timeout) {
        this.apiCalls.timeouts++;
      }
    }
  },
  
  recordPayment(status: 'success' | 'failed' | 'queued'): void {
    this.payments.attempted++;
    this.payments[status]++;
  },
  
  recordNetworkDrop(): void {
    this.networkStatus.connectionDrops++;
    logger.warn('network', 'Network connection lost', {
      drops: this.networkStatus.connectionDrops,
      lastOnline: this.networkStatus.lastOnline,
    });
  },
  
  recordNetworkRestore(): void {
    this.networkStatus.lastOnline = Date.now();
    logger.info('network', 'Network connection restored', {
      drops: this.networkStatus.connectionDrops,
      downtime: Date.now() - this.networkStatus.lastOnline,
    });
  },
  
  recordPrescription(status: 'generated' | 'downloaded' | 'failed'): void {
    this.prescription[status]++;
  }
};

/**
 * Set up network monitoring if in browser
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    metrics.recordNetworkRestore();
  });
  
  window.addEventListener('offline', () => {
    metrics.recordNetworkDrop();
  });
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logger.error(
        'unhandled_promise',
        'Unhandled Promise Rejection',
        {
          reason: event.reason,
          stack: event.reason?.stack
        }
      );
    });
    
    // Capture global errors
    window.addEventListener('error', (event) => {
      logger.error(
        'global_error',
        'Uncaught Error',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      );
      
      // Prevent default handling
      event.preventDefault();
    });
    
    logger.info('monitoring', 'Global error handlers registered');
  }
}