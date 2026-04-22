const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const notificationService = require('../backend/services/notificationService');

async function trigger() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Triggering Unassigned Task Alerts...');
    await notificationService.notifyManagerUnassignedTasks();
    console.log('Alerts triggered successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Trigger failed:', error);
    process.exit(1);
  }
}

trigger();
