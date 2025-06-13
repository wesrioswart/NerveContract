import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure Neon with error handling
try {
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineConnect = false;
  
  // Additional configuration to handle WebSocket errors
  neonConfig.fetchConnectionCache = true;
  neonConfig.subtls = undefined;
} catch (error) {
  console.warn('Neon WebSocket configuration warning:', error);
}

// Create pool with conservative settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Conservative pool size
  min: 0, // No minimum connections
  idleTimeoutMillis: 10000, // Short idle timeout
  connectionTimeoutMillis: 8000, // Reasonable connection timeout
  maxUses: 1000, // Conservative max uses
  allowExitOnIdle: true, // Allow exit on idle
});

// Graceful error handling for pool
pool.on('error', (err) => {
  console.error('Database pool error (non-fatal):', err.message);
});

pool.on('connect', () => {
  console.log('Database pool connected successfully');
});

// Handle uncaught WebSocket errors
process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('Cannot set property message')) {
    console.warn('Neon WebSocket error handled gracefully:', error.message);
    return;
  }
  throw error;
});

export const db = drizzle({ client: pool, schema });
