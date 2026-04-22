const mongoose = require('mongoose');
const dotenv = require('dotenv');
const notificationService = require('./services/notificationService');

// Load environment variables
dotenv.config();

/**
 * Reusable function to trigger pending task alerts manually or programmatically.
 */
async function sendPendingAlerts() {
  try {
    // Connect if not already connected (for standalone execution)
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected.');
    }

    console.log('Triggering Unassigned Task Alerts...');
    await notificationService.sendPendingAlerts();
    console.log('Alerts triggered successfully.');
  } catch (error) {
    console.error('Trigger failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Support for direct execution via 'node manual_trigger_alerts.js'
if (require.main === module) {
  sendPendingAlerts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { sendPendingAlerts };
