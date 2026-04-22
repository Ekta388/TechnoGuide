const cron = require('node-cron');
const notificationService = require('./notificationService');
const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const Assignment = require('../models/Assignment');
const Package = require('../models/Package');
const Client = require('../models/Client');

/**
 * Cron Service
 * Schedules and executes periodic background jobs.
 */
class CronService {
  init() {
    console.log('⏳ Initializing Cron Jobs...');

    // 1. Morning Job: Daily Summary at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      const start = Date.now();
      console.log('Running Morning Notification Job (9:00 AM)');
      await notificationService.sendMorningNotification();

      console.log('Running Deferred WhatsApp Task Assignments (9:00 AM)');
      await notificationService.processPendingTaskAssignments();

      console.log('Running Package Deliverable Audit (9:00 AM)');
      await this.auditPackageDeliverables();
      console.log(`[Cron] Morning Job completed in ${Date.now() - start}ms`);
    });

    // 2. Fixed Daily Reports: 12:00 PM Only (as requested)
    cron.schedule('0 12 * * *', async () => {
      const start = Date.now();
      console.log('Running Fixed Scheduled Pending Task Report (12:00 PM)');
      await notificationService.sendPendingAlerts();
      console.log(`[Cron] 12:00 PM Report completed in ${Date.now() - start}ms`);
    });

    // 3. Task Reminder Check: Every 1 minute (for absolute precision on 50% and 15m checks)
    cron.schedule('* * * * *', async () => {
      const start = Date.now();
      await this.checkTaskIntervalReminders();
      const duration = Date.now() - start;
      if (duration > 5000) {
        console.warn(`[Cron] Task Reminder Check took unusually long: ${duration}ms`);
      }
    });

    // 4. Auto Task Completion: Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      const start = Date.now();
      console.log('Running Auto Task Completion Check (Every 5 mins)');
      await this.autoCompleteTasks();
      console.log(`[Cron] Auto Task Completion completed in ${Date.now() - start}ms`);
    });
  }

  /**
   * Check tasks for interval-based reminders (e.g. 50%, 100% of duration).
   */
  async checkTaskIntervalReminders() {
    try {
      const now = new Date();
      // Only check tasks that are NOT completed
      const activeTasks = await Task.find({
        status: { $in: ['Pending', 'In Progress'] },
        assignedTo: { $ne: null }
      }).populate('assignedTo client package');

      for (const task of activeTasks) {
        const createdAt = new Date(task.createdAt);
        const dueDate = new Date(task.dueDate);
        const [hours, minutes] = (task.dueTime || '09:00').split(':').map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
        const durationMs = dueDate - createdAt;

        if (durationMs <= 0) continue;

        const elapsedMs = now - createdAt;
        const progress = elapsedMs / durationMs;
        const timeLeftHrs = (durationMs - elapsedMs) / (1000 * 60 * 60);

        // Send 1st reminder if progress >= 50% AND we haven't sent any interval reminders
        if (progress >= 0.5 && task.remindersSent === 0) {
          await notificationService.sendTaskReminder(task, timeLeftHrs);
        }
        // Send 2nd reminder if time left is <= 15 minutes (0.25 hours) AND we've only sent 1 interval reminder
        else if (timeLeftHrs <= 0.25 && task.remindersSent === 1) {
          await notificationService.sendTaskReminder(task, timeLeftHrs);
        }
      }
    } catch (error) {
      console.error('Error in checkTaskIntervalReminders cron:', error);
    }
  }

  /**
   * Old task check (Simplified/Replaced by interval reminders but kept for compatibility)
   */
  async checkTasks() {
    try {
      // Logic absorbed into checkTaskIntervalReminders
    } catch (error) {
      console.error('Error in checkTasks cron:', error);
    }
  }

  /**
   * Audit package deliverables and collect delayed items to send a grouped report
   */
  async auditPackageDeliverables() {
    try {
      const activeAssignments = await Assignment.find()
        .populate('package')
        .populate('client');

      let delayedItems = [];

      for (const assignment of activeAssignments) {
        if (!assignment.package || !assignment.client) continue;

        const startDate = new Date(assignment.startDate);
        const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date();
        const now = new Date();
        const calculationDate = now > endDate ? endDate : now;

        if (calculationDate <= startDate) continue;

        let elapsedFullMonths = (calculationDate.getFullYear() - startDate.getFullYear()) * 12 + (calculationDate.getMonth() - startDate.getMonth());

        if (calculationDate.getDate() < startDate.getDate()) {
          const lastDayOfCalcMonth = new Date(calculationDate.getFullYear(), calculationDate.getMonth() + 1, 0).getDate();
          if (calculationDate.getDate() !== lastDayOfCalcMonth || startDate.getDate() <= lastDayOfCalcMonth) {
            elapsedFullMonths--;
          }
        }

        const currentMonthIndex = Math.max(0, elapsedFullMonths);

        for (const progress of assignment.deliverablesProgress) {
          const targetToDate = Math.min(progress.total, progress.monthlyCount * (currentMonthIndex + 1));
          const pending = Math.max(0, targetToDate - (progress.completedCount || 0));

          if (pending > 0) {
            delayedItems.push({
              clientName: assignment.client.name,
              packageName: assignment.package.name,
              serviceName: progress.name,
              target: targetToDate,
              completed: progress.completedCount || 0
            });
          }
        }
      }

      if (delayedItems.length > 0) {
        await notificationService.sendGroupedDeliveryAlerts(delayedItems);
      }
    } catch (error) {
      console.error('Error in auditPackageDeliverables cron:', error);
    }
  }

  /**
   * Automatically complete tasks that have passed their due date and time.
   * Moves tasks from Task to TaskHistory with a clean mapping.
   */
  async autoCompleteTasks() {
    try {
      const now = new Date();
      // Find tasks that might be expired (due date is today or in the past)
      const potentialTasks = await Task.find({
        dueDate: { $lte: now }
      });

      if (potentialTasks.length === 0) return;

      const expiredTasks = potentialTasks.filter(task => {
        const dDate = new Date(task.dueDate);
        const [h, m] = (task.dueTime || '09:00').split(':').map(Number);
        dDate.setHours(h, m, 0, 0);
        return now >= dDate;
      });

      if (expiredTasks.length === 0) return;

      console.log(`[Cron] Found ${expiredTasks.length} expired tasks. Moving to history...`);

      for (const task of expiredTasks) {
        try {
          // Prepare clean history record as per user mapping
          const historyTask = {
            title: task.title,
            client: task.client,
            assignedTo: task.assignedTo,
            assignedBy: task.assignedBy,
            assignedDate: task.createdAt, // Original assign time
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            completedDate: new Date(),    // NEW (marking completion time)
            instructions: task.instructions,
            taskDetails: task.taskDetails,
            referenceFiles: task.referenceFiles,
            type: task.type,
            impactedDeliverables: task.impactedDeliverables
          };

          // Save to history
          await new TaskHistory(historyTask).save();

          // Remove from active tasks
          await Task.deleteOne({ _id: task._id });

          console.log(`[Cron] Task "${task.title}" (ID: ${task._id}) archived.`);
        } catch (taskError) {
          console.error(`[Cron] Error processing task ${task._id}:`, taskError);
        }
      }
    } catch (error) {
      console.error('Error in autoCompleteTasks cron:', error);
    }
  }
}

module.exports = new CronService();
