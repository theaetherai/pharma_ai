"use client";

import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Disable debug logging
const DEBUG = false;

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[SIGN-IN CALLBACK]', ...messages);
  }
}

export default function SignInSSOCallback() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(true);

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded || !signIn) {
      debug('Clerk not loaded yet');
      return;
    }

    debug('Clerk loaded, processing callback');

    async function processCallback() {
      try {
        // Parse parameters from the URL
        const params = new URLSearchParams(window.location.search);
        
        // Display the URL params for debugging
        debug("Callback URL params:", Object.fromEntries(params.entries()));
        
        // Try to complete the OAuth flow with Clerk
        if (params.has('__clerk_status')) {
          debug('Found clerk_status, attempting to create session');
          try {
            if (setActive) {
              debug('Setting active session');
              await setActive({ session: params.get('__clerk_status') || undefined });
              debug('Session activated successfully');
              
              // Redirect to dashboard with a slight delay
              setTimeout(() => {
                debug('Redirecting to dashboard after successful authentication');
                router.push("/dashboard");
              }, 500);
              return;
            }
          } catch (err) {
            debug('Error setting active session', err);
            console.error('Error setting active session:', err);
          }
        }
        
        // Force redirect to dashboard if authentication succeeded
        if (params.get('status') === 'complete') {
          debug("Authentication successful, redirecting to dashboard");
          
          // Add a slight delay before redirecting
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
          return;
        }
        
        // Check if there's an error
        if (params.get('error')) {
          const errorMessage = params.get('error') || "Unknown OAuth error";
          debug("OAuth error:", errorMessage);
          console.error("OAuth error:", errorMessage);
          setError(errorMessage);
          setProcessing(false);
          
          // Redirect back to sign-in after displaying the error
          setTimeout(() => {
            router.push("/sign-in");
          }, 3000);
          return;
        }
        
        // Default fallback
        debug("No complete status found, returning to sign-in");
        setProcessing(false);
        setTimeout(() => {
          router.push("/sign-in");
        }, 1500);
      } catch (error) {
        debug("Error handling OAuth callback:", error);
        console.error("Error handling OAuth callback:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        setProcessing(false);
        setTimeout(() => {
          router.push("/sign-in");
        }, 3000);
      }
    }

    processCallback();
  }, [isLoaded, signIn, setActive, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">Completing sign in...</h1>
        {error ? (
          <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">
            <p className="font-semibold">Error occurred:</p>
            <p>{error}</p>
            <p className="mt-2 text-gray-600">Redirecting you back to the sign-in page.</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {processing 
                ? "Processing authentication..." 
                : "You'll be redirected to the dashboard shortly."}
            </p>
          </>
        )}
      </div>
    </div>
  );
} 