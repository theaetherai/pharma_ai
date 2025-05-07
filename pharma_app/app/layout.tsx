import type { Metadata } from 'next'
import { ClerkProvider } from "@clerk/nextjs";
import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner";
import { ResilienceInit } from "./resilience-init";

const inter = Inter({ subsets: ['latin'] })

// Import the monitoring setup
import { setupGlobalErrorHandling } from "@/lib/monitoring";

// Initialize the error handling system
if (typeof window !== 'undefined') {
  // Set up global error handling in client side
  setupGlobalErrorHandling();
}

export const metadata: Metadata = {
  title: 'PharmaAI',
  description: 'AI-powered health and prescription assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body className={inter.className}>
          {/* 
            Note: Session duration is configured through Clerk Dashboard or environment variables
            To set a 2-day session duration, add these to your .env.local file:
            CLERK_DEVELOPMENT_SESSION_DURATION=2d
            CLERK_PRODUCTION_SESSION_DURATION=2d
          */}
          {children}
          <Toaster />
          <ResilienceInit />
        </body>
      </html>
    </ClerkProvider>
  )
}
