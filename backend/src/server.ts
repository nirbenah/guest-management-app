import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',  // Production frontend
  'http://localhost:8000',  // Demo frontend
  'http://localhost:3000',  // Same origin
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

console.log('🔗 CORS enabled for origins:', allowedOrigins);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Serve demo frontend from the same origin FIRST (development only)
if (process.env.NODE_ENV === 'development') {
  const publicPath = path.resolve(__dirname, '../public');
  console.log(`🔍 Setting up static files from: ${publicPath}`);
  
  const fs = require('fs');
  if (fs.existsSync(publicPath)) {
    console.log(`✅ Public directory exists with files:`, fs.readdirSync(publicPath));
    app.use(express.static(publicPath));
    console.log(`📁 Static files served from root`);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Demo frontend routes (temporary fix)
if (process.env.NODE_ENV === 'development') {
  const fs = require('fs');
  const publicPath = path.resolve(__dirname, '../public');
  
  app.get('/', (req, res) => {
    console.log('📄 Serving index.html');
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  app.get('/app.js', (req, res) => {
    console.log('📄 Serving app.js');
    res.sendFile(path.join(publicPath, 'app.js'));
  });
  
  app.get('/test.html', (req, res) => {
    console.log('📄 Serving test.html');
    res.sendFile(path.join(publicPath, 'test.html'));
  });
}

// API routes
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import guestRoutes from './routes/guests';
import groupRoutes from './routes/groups';
import versionRoutes from './routes/versions';
import tableRoutes from './routes/tables';
import collaboratorRoutes from './routes/collaborators';

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/collaborators', collaboratorRoutes);

// Handle 404 routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (all interfaces)`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;