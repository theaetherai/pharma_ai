import { PrismaClient } from "@prisma/client";

// Verify we're not in a browser environment
const isBrowser = typeof window !== 'undefined';

// Avoid multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Check if we're in a browser environment
let prisma: PrismaClient;

if (isBrowser) {
  // Create a proxy to handle browser-side usage attempts
  prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
      console.error(`Prisma cannot be used in the browser. You are trying to access: ${String(prop)}`);
      return () => {
        throw new Error(
          'PrismaClient cannot be used in the browser.\n' +
          'Please use server components or API routes to access the database.'
        );
      };
    },
  });
} else {
  // Create a singleton instance of PrismaClient for server environment
  prisma = globalThis.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  });
  
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
  }
}

// Export the PrismaClient instance
export { prisma }; 