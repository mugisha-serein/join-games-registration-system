const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/env');
const { initializeDatabase } = require('./database/initialize');
const { initializeSocket } = require('./services/socket.service');
const errorHandler = require('./middleware/error-handler');
const notFoundHandler = require('./middleware/not-found');

// Import routes
const registrationRoutes = require('./routes/registration.routes');
const adminAuthRoutes = require('./routes/admin-auth.routes');
const adminUsersRoutes = require('./routes/admin-users.routes');

const app = express();

app.set('trust proxy', 1);

const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server);

// Share IO instance in express app
app.set('io', io);

// Security configuration using Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  })
);

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session middleware configuration
const sessionMiddleware = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

app.use(sessionMiddleware);

// Share express session with Socket.IO
io.engine.use(sessionMiddleware);

// Custom authorization middleware for static /admin files
app.use((req, res, next) => {
  const pathName = req.path;
  if (pathName.startsWith('/admin')) {
    const isAdmin = req.session && req.session.admin;
    if (pathName === '/admin/login.html' || pathName === '/admin' || pathName === '/admin/') {
      if (isAdmin) {
        return res.redirect('/admin/dashboard.html');
      }
    } else {
      if (!isAdmin) {
        return res.redirect('/admin/login.html');
      }
    }
  }
  next();
});

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', registrationRoutes);
app.use('/api', adminAuthRoutes);
app.use('/api', adminUsersRoutes);

// Catch-all API and static not found
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

// Initialize DB and start listening
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      initializeSocket(io);

      server.listen(config.port, '0.0.0.0', () => {
        console.log(
          `Server running in ${config.nodeEnv} mode on port ${config.port}`
        );
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = { app, server, io };
