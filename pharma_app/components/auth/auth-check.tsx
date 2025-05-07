"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface AuthCheckProps {
  children: React.ReactNode;
  publicRoutes?: string[];
}

export function AuthCheck({ children, publicRoutes = [] }: AuthCheckProps) {
  const { isLoaded, userId, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded) return;

    // Get the current path
    const path = window.location.pathname;
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.includes(path) || 
                       path === "/" || 
                       path.startsWith('/sign-in') || 
                       path.startsWith('/sign-up');
    
    // If user is signed in and on a public route, redirect to dashboard
    if (isSignedIn && isPublicRoute) {
      console.log('User is already signed in, redirecting to dashboard');
      router.push('/dashboard');
    }
    
    // If user is not signed in and on a protected route, redirect to sign-in
    if (!isSignedIn && !isPublicRoute) {
      console.log('User is not signed in, redirecting to sign-in page');
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, userId, router, publicRoutes]);

  // Return children regardless of auth state - the redirect will happen via the useEffect
  return <>{children}</>;
} 