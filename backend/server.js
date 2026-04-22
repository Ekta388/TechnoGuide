const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Serve static files from uploads folder
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const teamRoutes = require('./routes/teamRoutes');
const packageRoutes = require('./routes/packageRoutes');
const taskRoutes = require('./routes/taskRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cronService = require('./services/cronService');
const expiryCron = require('./services/expiryCron');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// WhatsApp Web View Route (for Production Panel scanning)
app.get('/api/whatsapp/status', (req, res) => {
  const whatsappService = require('./services/whatsappService');

  if (whatsappService.isReady) {
    return res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: #16a34a;">✅ WhatsApp is Connected!</h1>
        <p>The bot is currently active and processing messages.</p>
      </div>
    `);
  }

  if (whatsappService.currentQrUrl) {
    return res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h2 style="color: #2563eb;">Scan this QR Code to Link WhatsApp</h2>
        <p>Open WhatsApp on your phone > Settings > Linked Devices > Link a Device</p>
        <img src="${whatsappService.currentQrUrl}" alt="QR Code" style="width: 300px; height: 300px; border: 2px solid #ccc; border-radius: 10px; padding: 10px;" />
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This page will automatically refresh every 5 seconds...</p>
        <script>
           setTimeout(() => location.reload(), 5000);
        </script>
      </div>
    `);
  }

  return res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h2 style="color: #ea580c;">⏳ Starting WhatsApp Client...</h2>
        <p>Please wait a few moments while the engine initializes. The QR code will appear shortly.</p>
        <script>
           setTimeout(() => location.reload(), 5000);
        </script>
      </div>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ TechnoGuide Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:3000`);

  // Initialize Cron Jobs
  cronService.init();
  expiryCron.init();

});
