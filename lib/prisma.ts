// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isReconnecting: boolean;
  reconnectPromise: Promise<PrismaClient> | undefined;
};

// Helper function to create a new Prisma client
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Function to handle reconnection
async function reconnectPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.isReconnecting && globalForPrisma.reconnectPromise) {
    // If already reconnecting, wait for the existing reconnection
    return await globalForPrisma.reconnectPromise;
  }

  globalForPrisma.isReconnecting = true;
  
  globalForPrisma.reconnectPromise = (async () => {
    try {
      console.log('🔄 Creating new Prisma client...');
      const newClient = createPrismaClient();
      await newClient.$connect();
      
      // Disconnect old client if it exists
      if (globalForPrisma.prisma) {
        try {
          await globalForPrisma.prisma.$disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      
      // Update global reference
      globalForPrisma.prisma = newClient;
      console.log('✅ Successfully reconnected to database');
      
      return newClient;
    } finally {
      globalForPrisma.isReconnecting = false;
      globalForPrisma.reconnectPromise = undefined;
    }
  })();
  
  return await globalForPrisma.reconnectPromise;
}

// Initialize global flags
globalForPrisma.isReconnecting = false;
globalForPrisma.reconnectPromise = undefined;

// Create Prisma client instance
let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  prisma = createPrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
}

// Create a proxy that handles reconnection on "Engine is not yet connected" errors
const createReconnectingProxy = (client: PrismaClient) => {
  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop as keyof PrismaClient];
      
      // If it's a model (like 'user', 'ticket', etc.)
      if (typeof value === 'object' && value !== null && 'findMany' in value) {
        return new Proxy(value, {
          get(modelTarget, modelProp) {
            const modelValue = modelTarget[modelProp as keyof typeof modelTarget];
            
            // If it's a query method
            if (typeof modelValue === 'function') {
              return async (...args: any[]) => {
                try {
                  // Use the current global client if available
                  const currentClient = globalForPrisma.prisma || target;
                  const currentModel = currentClient[prop as keyof PrismaClient] as any;
                  return await currentModel[modelProp].apply(currentModel, args);
                } catch (error: any) {
                  // If engine is not connected, reconnect and retry
                  if (error.message && (
                    error.message.includes('Engine is not yet connected') ||
                    error.message.includes('Response from the Engine was empty')
                  )) {
                    console.log('🔄 Prisma engine disconnected, reconnecting...');
                    
                    // Reconnect using the improved function
                    const newClient = await reconnectPrisma();
                    
                    // Retry the operation with the new client
                    const newModel = newClient[prop as keyof PrismaClient] as any;
                    return await newModel[modelProp].apply(newModel, args);
                  }
                  throw error;
                }
              };
            }
            
            return modelValue;
          }
        });
      }
      
      return value;
    }
  });
};

export { prisma };
export const prismaWithReconnect = createReconnectingProxy(prisma);
