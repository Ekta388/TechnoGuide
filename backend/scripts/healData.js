const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technoguide';

async function healData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for data healing...');

    // 1. Heal Active Tasks
    const activeResult = await Task.updateMany(
      { dueTime: { $exists: false } },
      { $set: { dueTime: '09:00' } }
    );
    console.log(`Updated ${activeResult.modifiedCount} active tasks with default dueTime.`);

    // 2. Heal Task History
    const historyTasks = await TaskHistory.find({ assignedDate: { $exists: false } });
    let historyCount = 0;
    
    for (const task of historyTasks) {
      task.assignedDate = task.createdAt || new Date();
      await task.save({ validateBeforeSave: false });
      historyCount++;
    }
    console.log(`Updated ${historyCount} history tasks with assignedDate.`);

    console.log('Data healing completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Data healing failed:', error);
    process.exit(1);
  }
}

healData();
