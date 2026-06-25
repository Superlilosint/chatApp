const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const connectDB = require('./config/db');
require('./config/passport');
const initSocket = require('./socket');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

connectDB();
initSocket(server);

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: env.nodeEnv === 'production' ? false : env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api/rooms', apiLimiter, roomRoutes);
app.use('/api/users', apiLimiter, userRoutes);

// Serve React build in production
if (env.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.use(errorHandler);

// Graceful shutdown
function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false).then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});
