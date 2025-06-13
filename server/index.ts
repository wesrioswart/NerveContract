import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { initializeEventBus } from "./event-bus";
import { errorHandler, requestLogger } from "./middleware/error-middleware.js";
import { memoryMonitoring, handleMemoryErrors, scheduleMemoryCleanup } from "./middleware/memory-management.js";
import { compressionMonitoring, compressionHeaders } from "./middleware/compression-analytics.js";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname equivalent for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// API Response Compression - Optimized for contract management platform
app.use(compression({
  filter: (req, res) => {
    // Skip compression for specific headers or small responses
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Always compress JSON API responses
    if (req.path.startsWith('/api') && res.get('Content-Type')?.includes('application/json')) {
      return true;
    }
    
    // Skip compression for already compressed file types
    if (req.path.match(/\.(jpg|jpeg|png|gif|woff|woff2)$/)) {
      return false;
    }
    
    // Use default compression filter for other content
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses larger than 1KB
  memLevel: 8, // Memory usage vs speed trade-off
}));

// Increase JSON payload limit to 10MB for larger files
app.use(express.json({ limit: '10mb' }));
// Increase URL-encoded payload limit to 10MB
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Set up view engine for templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Add memory monitoring middleware
app.use(memoryMonitoring);

// Add compression monitoring and headers
app.use(compressionHeaders);
app.use(compressionMonitoring);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed the database with initial data
  await seedDatabase();
  
  // Initialize the event-driven agent communication system
  initializeEventBus();
  
  // Schedule periodic memory cleanup
  scheduleMemoryCleanup();
  
  // Add request logging middleware
  app.use(requestLogger);
  
  const server = await registerRoutes(app);

  // Add memory error handling middleware
  app.use(handleMemoryErrors);

  // Use comprehensive error handling middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
