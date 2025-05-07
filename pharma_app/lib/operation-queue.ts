import PQueue from 'p-queue';
import { QueuedOperation, getQueuedOperations, removeOperation, updateOperation, queueOperation as queueOperationToIDB } from './idb-storage';
import { retryOperation, isNetworkError } from './api-helpers';
import { toast } from 'sonner';

// Queue for processing operations with concurrency control
const queue = new PQueue({ concurrency: 2 });
let isProcessing = false;

/**
 * Queue an operation for processing
 */
export async function queueOperation(
  type: QueuedOperation['type'],
  data: any
): Promise<string> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    console.warn('Operation queue not available in server environment');
    return `${type}_${Date.now()}_server`;
  }

  const operation: QueuedOperation = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    attempts: 0
  };
  
  await queueOperationToIDB(operation);
  
  // Try to process queue immediately if we're online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    processQueue().catch(console.error);
  }
  
  return operation.id;
}

/**
 * Process all queued operations
 */
export async function processQueue(): Promise<void> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    console.warn('Operation queue not available in server environment');
    return;
  }
  
  // Avoid multiple simultaneous processing attempts
  if (isProcessing) return;
  
  try {
    isProcessing = true;
    
    // Check if we're online before starting
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Browser is offline, skipping queue processing');
      return;
    }
    
    const operations = await getQueuedOperations();
    
    if (operations.length === 0) {
      console.log('No operations in queue to process');
      return;
    }
    
    console.log(`Processing ${operations.length} queued operations`);
    
    // Add all operations to the queue
    operations.forEach(operation => {
      queue.add(() => processOperation(operation));
    });
    
    // Wait for queue to drain
    await queue.onIdle();
    console.log('All queued operations processed');
  } catch (error) {
    console.error('Error processing operation queue:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a single operation
 */
async function processOperation(operation: QueuedOperation): Promise<void> {
  // Skip operations with too many attempts
  if (operation.attempts >= 5) {
    console.warn(`Operation ${operation.id} has exceeded max attempts, removing from queue`);
    await removeOperation(operation.id);
    return;
  }
  
  try {
    operation.attempts++;
    await updateOperation(operation);
    
    console.log(`Processing operation ${operation.id} (attempt ${operation.attempts})`);
    
    // Process based on operation type
    switch (operation.type) {
      case 'payment':
        await processPaymentOperation(operation);
        break;
        
      case 'order':
        await processOrderOperation(operation);
        break;
        
      case 'prescription':
        await processPrescriptionOperation(operation);
        break;
        
      default:
        console.warn(`Unknown operation type: ${(operation as any).type}`);
    }
    
    // If we get here, operation succeeded - remove from queue
    await removeOperation(operation.id);
    console.log(`Operation ${operation.id} completed successfully`);
  } catch (error) {
    console.error(`Error processing operation ${operation.id}:`, error);
    
    // If it's a network error, keep in queue for retry
    if (isNetworkError(error)) {
      console.log(`Network error for operation ${operation.id}, will retry later`);
      
      // Update the operation with incremented attempts
      await updateOperation(operation);
      
      // If this was the last operation, show a toast
      const operations = await getQueuedOperations();
      if (operations.length === 1 && operations[0].id === operation.id) {
        if (typeof document !== 'undefined') { // Only in browser
          toast.error('Network error. Operation will retry when connectivity is restored.');
        }
      }
    } else {
      // For non-network errors, remove from queue after too many attempts
      if (operation.attempts >= 3) {
        console.warn(`Non-network error for operation ${operation.id}, removing from queue after ${operation.attempts} attempts`);
        await removeOperation(operation.id);
        
        if (typeof document !== 'undefined') { // Only in browser
          toast.error('Failed to process operation. Please try again.');
        }
      } else {
        // Update with incremented attempts for retry
        await updateOperation(operation);
      }
    }
  }
}

/**
 * Process a payment verification operation
 */
async function processPaymentOperation(operation: QueuedOperation): Promise<void> {
  const { reference, amount, cart, deliveryAddressId, deliveryAddress, userEmail } = operation.data;
  
  // Verify payment with backend
  const response = await retryOperation(() => 
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        amount,
        cart,
        deliveryAddressId,
        deliveryAddress,
        userEmail
      }),
    })
  );
  
  if (!response.ok) {
    throw new Error(`Payment verification failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Payment verification failed: ${data.message}`);
  }
  
  // Notify user of successful payment
  if (typeof document !== 'undefined') {
    toast.success('Payment processed successfully');
  }
}

/**
 * Process an order operation
 */
async function processOrderOperation(operation: QueuedOperation): Promise<void> {
  // Implement order processing logic
  console.log('Processing order operation', operation.data);
  
  // This would call your order API
  // const response = await retryOperation(() => fetch('/api/orders', {...}));
}

/**
 * Process a prescription operation
 */
async function processPrescriptionOperation(operation: QueuedOperation): Promise<void> {
  // Implement prescription processing logic
  console.log('Processing prescription operation', operation.data);
  
  // This would call your prescription API
  // const response = await retryOperation(() => fetch('/api/prescriptions', {...}));
}

// Only set up listeners in browser environment
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser is online, processing queued operations');
    if (typeof toast !== 'undefined') {
      toast.info('Connection restored, processing pending operations...');
    }
    processQueue();
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser is offline, operations will be queued');
    if (typeof toast !== 'undefined') {
      toast.warning('Connection lost. Operations will resume when online.');
    }
  });
  
  // Process queue on initial load
  if (document.readyState === 'complete') {
    processQueue();
  } else {
    window.addEventListener('load', () => {
      processQueue();
    });
  }
} 