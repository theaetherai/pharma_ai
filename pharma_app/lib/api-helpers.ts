import pRetry from 'p-retry';

/**
 * Retry an async operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param initialDelay Initial delay in ms (default: 1000)
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  return pRetry(
    async () => {
      try {
        return await operation();
      } catch (error: any) {
        // Network or database connectivity errors should be retried
        const dbErrorMessages = [
          "Can't reach database server",
          "connect ETIMEDOUT",
          "connect ECONNREFUSED",
          "failed to connect to database",
          "Connection refused",
          "Connection reset",
          "timeout expired",
          "Neon project is currently paused"
        ];
        
        // Check if error contains any of the DB error messages
        const isDbConnectivityError = dbErrorMessages.some(msg => 
          error?.message?.includes(msg)
        );
        
        // Known Prisma error codes that are related to connectivity issues
        const isRetryablePrismaError = 
          error?.code === 'P1001' || // Database connectivity
          error?.code === 'P1002' || // Unknown server error
          error?.code === 'P1008' || // Operations timed out
          error?.code === 'P1017' || // Server closed connection
          error?.code === 'P2028' || // Transaction timeout
          error?.name === 'PrismaClientInitializationError' ||
          error?.name === 'PrismaClientRustPanicError';
        
        // Network errors should also be retried
        const isNetworkError = 
          error?.message?.includes('network') ||
          error?.message?.includes('connection') ||
          error?.code === 'ECONNREFUSED' ||
          error?.code === 'ETIMEDOUT' ||
          error?.code === 'ENOTFOUND' ||
          error?.code === 'EAI_AGAIN';
        
        // Determine if the error is retryable
        const isRetryableError = isDbConnectivityError || isRetryablePrismaError || isNetworkError;
        
        // Non-retryable errors should be thrown immediately
        if (!isRetryableError) {
          console.log('Non-retryable error encountered:', error);
          // Use a non-retryable error to abort retry attempts
          throw new NonRetryableError(error);
        }
        
        // Log retryable errors and continue with retry
        console.warn('Retryable error encountered:', error);
        throw error; // This will trigger a retry
      }
    },
    {
      retries: maxRetries,
      minTimeout: initialDelay,
      factor: 2, // Exponential factor
      onFailedAttempt: (error) => {
        console.log(
          `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
          error.message
        );
      },
    }
  );
}

// Custom error class that extends Error for non-retryable errors
class NonRetryableError extends Error {
  readonly code: string;
  readonly cause?: Error;
  
  constructor(originalError: Error) {
    super(originalError.message);
    this.name = 'NonRetryableError';
    this.code = 'ABORT_RETRY';
    
    // Keep a reference to the original error
    this.cause = originalError;
    
    // Preserve the stack trace
    if (originalError.stack) {
      this.stack = originalError.stack;
    }
    
    // Pass this instance to p-retry's shouldRetry function to abort retries
    Object.defineProperty(this, 'shouldRetry', {
      value: false,
      writable: false
    });
  }
}

/**
 * Check if an error is likely a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Database connection errors should also be treated as network errors
  // for the purposes of offline queue handling
  const isDatabaseError = 
    error.code === 'P1001' ||  // Database connectivity
    error.code === 'P1002' ||  // Unknown server error
    error.code === 'P1008' ||  // Operations timed out
    error.code === 'P1017' ||  // Server closed connection
    error.code === 'P2028' ||  // Transaction timeout
    error.name === 'PrismaClientInitializationError' ||
    error.name === 'PrismaClientRustPanicError' ||
    (error.message && (
      error.message.includes("Can't reach database") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("Connection refused") ||
      error.message.includes("Connection reset") ||
      error.message.includes("timeout expired") ||
      error.message.includes("Neon project is currently paused")
    ));
  
  // Check various network error indicators
  return (
    isDatabaseError ||
    error.name === 'NetworkError' ||
    error.message?.includes('network') ||
    error.message?.includes('connection') ||
    error.message?.includes('offline') ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'EAI_AGAIN' ||
    (error.cause && isNetworkError(error.cause))
  );
} 