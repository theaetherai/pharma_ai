import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
declare global {
  var prisma: PrismaClient | undefined;
}

// Configuration for connection retries
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Helper to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if we have a DATABASE_URL
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.warn('DATABASE_URL is not defined. Using a dummy connection string for build.');
    // Return a dummy connection string that won't actually be used
    return 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public';
  }
  
  return url;
};

// In development, if the server restarts or hot-reloads occur, multiple instances
// of PrismaClient would be created without the global approach
const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log: ['error'], // Only log errors, not queries or warnings
    // Add connection timeout to avoid hanging requests
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    // Configure Prisma connection options
    errorFormat: 'pretty'
  });
};

// Create a Prisma client with connection retry logic
const createPrismaClient = async (): Promise<PrismaClient> => {
  let retries = 0;
  let prismaInstance: PrismaClient | null = null;
  
  while (retries < MAX_RETRIES && !prismaInstance) {
    try {
      // Create a new Prisma client instance
      prismaInstance = prismaClientSingleton();
      
      // Test the connection with a simple query
      await prismaInstance.$queryRaw`SELECT 1`;
      
      console.log('Successfully connected to the database');
      return prismaInstance;
    } catch (error) {
      retries++;
      console.error(`Database connection attempt ${retries} failed:`, error);
      
      // If we've maxed out retries, rethrow the error
      if (retries >= MAX_RETRIES) {
        console.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
        
        // Return a client anyway, but it will likely fail on operations
        return prismaClientSingleton();
      }
      
      // Wait before trying again (increasing delay with each retry)
      await wait(RETRY_DELAY_MS * retries);
    }
  }
  
  // This should never be reached due to the return or throw in the loop
  return prismaClientSingleton();
};

// Handle build-time vs. runtime for PrismaClient
let prisma: PrismaClient;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';
// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

if (!isBrowser) {
  if (isBuildTime) {
    // During build time, create a client but don't test the connection
    prisma = prismaClientSingleton();
  } else {
    // Server runtime environment: Use the global object to store the PrismaClient instance
    if (!globalThis.prisma) {
      // Set up prisma with a promise-based initialization, but handle the case
      // where we need to use it synchronously
      const prismaPromise = createPrismaClient();
      
      // Initialize with a base client that will be replaced once connected
      globalThis.prisma = prismaClientSingleton();
      
      // Update the global reference once connection is established
      prismaPromise.then(connectedClient => {
        globalThis.prisma = connectedClient;
      }).catch(error => {
        console.error('Failed to initialize database connection:', error);
      });
    }
    
    prisma = globalThis.prisma;
  }
} else {
  // We're in a browser environment
  // Create a mock object that throws more helpful errors when accessed
  prisma = new Proxy({} as PrismaClient, {
    get: (_, prop) => {
      console.error(
        `PrismaClient cannot be used in browser. You're trying to access "${String(prop)}" property.`
      );
      return () => {
        throw new Error(
          'PrismaClient cannot be used in browser environments.\n' +
          'Please use server components, API routes, or server actions to access the database.'
        );
      };
    },
  });
}

// Export the prisma client as db
export const db = prisma; 