"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw, Check, WifiOff } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { queueOperation } from "@/lib/operation-queue";
import { isNetworkError } from "@/lib/api-helpers";
import { toast } from "sonner";
import { metrics, logger } from "@/lib/monitoring";
import "@/lib/resilience-init"; // Import for side effects only

// Avoid importing Paystack during SSR/build
// React-Paystack will be dynamically imported at runtime

interface CartItem {
  id?: string;
  drugId: string;
  quantity: number;
  price: number;
  name?: string;
  dosage?: string;
  form?: string;
  orderId?: string;
}

interface PaystackButtonProps {
  amount: number;
  email?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  cart?: CartItem[];
  deliveryAddressId?: string;
  deliveryAddress?: string;
  idempotencyKey?: string | null;
  onSuccess: (data: any) => void;
  onCancel: () => void;
  onCloseCheckout?: () => void;
  children?: React.ReactNode;
}

export function PaystackButton({
  amount,
  email: propEmail,
  name,
  className = "",
  disabled = false,
  cart = [],
  deliveryAddressId,
  deliveryAddress,
  idempotencyKey,
  onSuccess,
  onCancel,
  onCloseCheckout,
  children
}: PaystackButtonProps) {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'offline'>('idle');
  const [isClient, setIsClient] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useUser();
  
  // Track online status
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      // Set initial online status
      setIsOnline(navigator.onLine);
      
      // Set up listeners for online/offline events
      const handleOnline = () => {
        setIsOnline(true);
        setPaymentStatus('idle');
      };
      
      const handleOffline = () => {
        setIsOnline(false);
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handlePaymentSuccess = async (response: any) => {
    setPaymentStatus('processing');
    try {
      // Record payment attempt in metrics
      metrics.payments.attempted++;
      
      // Format cart items for the API - log the cart for debugging
      console.log("Original cart for payment verification:", cart);
      
      // Log payment attempt
      logger.info('payment', 'Payment verification started', { 
        reference: response.reference,
        amount: amount
      });
      
      const formattedCart = cart.map(item => {
        // Ensure drugId is properly set and log any missing IDs
        if (!item.drugId && !item.id) {
          console.warn("Missing drugId for cart item:", item);
          // Create a fallback ID if none exists
          item.drugId = `drug_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Ensure drugId is set to a non-empty string
        const drugId = item.drugId || item.id || `drug_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        return {
          drugId,
          quantity: item.quantity || 1,
          price: item.price || 0,
          orderId: item.orderId
        };
      });
      
      console.log("Formatted cart for API:", formattedCart);
      
      // Get user email for identifying the user
      const userEmail = user?.primaryEmailAddress?.emailAddress || propEmail || 'customer@example.com';
      
      // Verify payment with backend
      const verifyResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: response.reference,
          amount: amount,
          cart: formattedCart,
          deliveryAddressId,
          deliveryAddress,
          userEmail
        }),
      });

      if (!verifyResponse.ok) {
        // Check if this is a network error
        if (!navigator.onLine || verifyResponse.status === 0) {
          // Queue the payment verification for when we're back online
          await handleOfflinePayment(response, formattedCart, userEmail);
          return;
        }
        
        throw new Error(`Payment verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
      }

      const resultData = await verifyResponse.json();
      
      if (!resultData.success) {
        // Record failure in metrics
        metrics.recordPayment('failed');
        logger.error('payment', 'Payment verification failed', { 
          reference: response.reference,
          error: resultData.message
        });
        
        throw new Error(`Payment verification failed: ${resultData.message}`);
      }
      
      // Record success in metrics
      metrics.recordPayment('success');
      logger.info('payment', 'Payment verified successfully', { 
        reference: response.reference,
        orderId: resultData.order?.id
      });
      
      setPaymentStatus('success');
      onSuccess(resultData);
    } catch (error) {
      console.error('Payment verification error:', error);
      
      // Check if it's a network error and handle offline payment
      if (isNetworkError(error) || !navigator.onLine) {
        await handleOfflinePayment(response, cart, user?.primaryEmailAddress?.emailAddress || propEmail);
        return;
      }
      
      // Record failure in metrics
      metrics.recordPayment('failed');
      logger.error('payment', 'Payment verification failed', { error });
      
      setPaymentStatus('error');
      toast.error("Payment verification failed. Please contact support with your reference number.");
    }
  };
  
  // Handle offline payment by queueing it for later
  const handleOfflinePayment = async (response: any, cartItems: any[], userEmail?: string) => {
    try {
      setPaymentStatus('offline');
      
      // Record queued payment in metrics
      metrics.recordPayment('queued');
      logger.info('payment', 'Payment queued for offline processing', { 
        reference: response.reference
      });
      
      // Queue the payment for processing when online
      await queueOperation('payment', {
        reference: response.reference,
        amount: amount,
        cart: cartItems,
        deliveryAddressId,
        deliveryAddress,
        userEmail,
        timestamp: Date.now()
      });
      
      toast.info("Payment will be processed when connection is restored.", {
        duration: 6000,
      });
      
      // Notify user via the success callback with offline flag
      onSuccess({
        success: true,
        isOffline: true,
        message: "Payment recorded and will be processed when online",
        reference: response.reference
      });
    } catch (queueError) {
      console.error('Error queueing offline payment:', queueError);
      
      // Record failure in metrics
      metrics.recordPayment('failed');
      logger.error('payment', 'Failed to queue offline payment', { 
        reference: response.reference,
        error: queueError
      });
      
      setPaymentStatus('error');
      toast.error("Could not save payment data. Take a screenshot of this page as proof of payment.");
    }
  };

  const handlePaymentCancel = () => {
    setPaymentStatus('idle');
    onCancel();
  };

  const handlePayment = async () => {
    if (!isClient) return;
    
    // Check if we're offline
    if (!navigator.onLine) {
      toast.error("You are currently offline. Please try again when connected to the internet.");
      return;
    }
    
    try {
      // Validate required fields - now check for either deliveryAddressId OR deliveryAddress
      if (!deliveryAddressId && !deliveryAddress) {
        console.error('Delivery address is required');
        toast.error("Please enter a delivery address");
        return;
      }
      
      // Close checkout modal immediately before PayStack modal appears
      if (onCloseCheckout) {
        onCloseCheckout();
      }
      
      // Get the public key from environment variable and validate it
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        console.error('Paystack public key is missing');
        toast.error("Payment configuration error. Please contact support.");
        return;
      }
      
      console.log("Initializing Paystack with public key:", publicKey.substring(0, 10) + "...");
      
      // Safely import Paystack at runtime (client-side only)
      let paystackModule;
      try {
        paystackModule = await import('react-paystack');
      } catch (importError) {
        console.error("Failed to import react-paystack:", importError);
        toast.error("Payment system could not be loaded. Please try again.");
        return;
      }
      
      const usePaystackPayment = paystackModule.usePaystackPayment;
      if (!usePaystackPayment) {
        console.error("Paystack payment hook not found in imported module");
        toast.error("Payment system initialization failed. Please try again.");
        return;
      }
      
      // Use Clerk user email if available, otherwise fallback to prop
      const userEmail = user?.primaryEmailAddress?.emailAddress || propEmail || 'customer@example.com';
      
      try {
        const initializePayment = usePaystackPayment({
          reference: idempotencyKey || (new Date()).getTime().toString(),
          email: userEmail,
          amount: Math.round(amount * 100),
          publicKey,
          label: name || userEmail,
          currency: 'GHS', // Changed from GHS to NGN for Nigerian currency
          metadata: {
            custom_fields: [
              {
                display_name: "Customer Email",
                variable_name: "customer_email",
                value: userEmail
              },
              {
                display_name: "Customer Name",
                variable_name: "customer_name",
                value: name || userEmail
              },
              {
                display_name: "Order ID",
                variable_name: "order_idempotency_key",
                value: idempotencyKey || ''
              }
            ]
          }
        });

        if (!initializePayment) {
          console.error("Paystack initialization function is undefined");
          toast.error("Payment system could not be initialized. Please try again.");
          return;
        }

        setPaymentStatus('processing');
        initializePayment({
          onSuccess: handlePaymentSuccess,
          onClose: handlePaymentCancel,
        });
      } catch (paystackError) {
        console.error("Paystack initialization error:", paystackError);
        toast.error("Payment system error. Please try again later.");
        setPaymentStatus('idle');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      setPaymentStatus('idle');
      toast.error("Could not initialize payment. Please try again.");
      onCancel();
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || paymentStatus !== 'idle' || !isClient || !isOnline}
      className={className}
    >
      {paymentStatus === 'idle' && (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {children || 'Pay Now'}
        </>
      )}
      {paymentStatus === 'processing' && (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      )}
      {paymentStatus === 'success' && (
        <>
          <Check className="mr-2 h-4 w-4" />
          Payment Successful
        </>
      )}
      {paymentStatus === 'offline' && (
        <>
          <WifiOff className="mr-2 h-4 w-4" />
          Payment Queued
        </>
      )}
      {!isOnline && (
        <>
          <WifiOff className="mr-2 h-4 w-4" />
          Offline (Unavailable)
        </>
      )}
    </Button>
  );
} 