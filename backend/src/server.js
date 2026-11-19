/**
 * MoveFlow TN - Backend Server
 * Node.js + Express + MongoDB + Socket.IO
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/database');
const { initEmailService } = require('./services/email.service');
const { initSocket } = require('./sockets/socket');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const routes = require('./routes/index');

// ─────────────────────────────────────────────
// App & HTTP Server
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// Socket.IO
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ─────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded files
  })
);

// CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ];
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10) * 60 * 1000;
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10);

// Limiter for auth routes (relaxed in development for seamless local testing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 30,
  message: { success: false, message: 'Trop de tentatives d\'authentification. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs,
  max: isDev ? 5000 : maxRequests,
  message: { success: false, message: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

// ─────────────────────────────────────────────
// Body Parsing & Logging
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─────────────────────────────────────────────
// Static File Serving (Uploaded Files)
// ─────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const staticUploadsPath = path.join(__dirname, '..', uploadDir);

// Global rewrite for any Windows backslashes in upload URLs
app.use((req, res, next) => {
  if (req.url.includes('/uploads%5C') || req.url.includes('/uploads%5c') || req.url.includes('/uploads\\')) {
    req.url = req.url.replace(/%5C|%5c|\\/g, '/');
  }
  next();
});

const staticOptions = {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.toLowerCase().endsWith('.jfif')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  },
};

app.use('/uploads', express.static(staticUploadsPath, staticOptions));
app.use('/api/v1/uploads', express.static(staticUploadsPath, staticOptions));

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MoversGo API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter, routes);

// ─────────────────────────────────────────────
// 404 & Error Handlers (must be last)
// ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Initialize email service (non-blocking)
  initEmailService();

  // Initialize Socket.IO handlers
  initSocket(io);

  // Automatic cleanup of expired archived support tickets (past 4-day retention)
  try {
    const { cleanupExpiredTickets } = require('./controllers/support.controller');
    cleanupExpiredTickets().catch((err) => console.warn('Initial ticket cleanup warning:', err.message));
    // Sweep every 1 hour
    setInterval(() => {
      cleanupExpiredTickets().catch((err) => console.warn('Hourly ticket cleanup sweep warning:', err.message));
    }, 60 * 60 * 1000);
  } catch (cleanErr) {
    console.warn('Could not initialize support ticket auto-cleanup worker:', cleanErr.message);
  }

  // Start HTTP server
  server.listen(PORT, () => {
    console.log('\n🚀 ═══════════════════════════════════════');
    console.log(`   MoversGo API Server`);
    console.log('   ═══════════════════════════════════════');
    console.log(`   🌍 URL:         http://localhost:${PORT}`);
    console.log(`   📡 API Base:    http://localhost:${PORT}/api/v1`);
    console.log(`   🔌 Socket.IO:   ws://localhost:${PORT}`);
    console.log(`   📦 Environment: ${process.env.NODE_ENV}`);
    console.log('   ═══════════════════════════════════════\n');
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

module.exports = { app, server, io };

