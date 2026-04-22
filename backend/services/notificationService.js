const Notification = require('../models/Notification');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const Team = require('../models/Team');
const Client = require('../models/Client');
const Package = require('../models/Package');

/**
 * Notification Service
 * Handles creation, sending, and tracking of system notifications via Email.
 */
class NotificationService {

  /**
   * Send a reminder for a pending task
   * @param {string} taskId - ID of the task
   */
  async sendTaskReminder(taskId) {
    try {
      const task = await Task.findById(taskId).populate('assignedTo client');
      if (!task || !task.assignedTo || task.status === 'Completed') return;

      const teamMember = task.assignedTo;
      if (!teamMember.email) return;

      const subject = `⏰ Reminder: Pending Task - ${task.title}`;
      const message = `Hello ${teamMember.name},\n\n` +
        `This is a reminder for your pending task.\n\n` +
        `Task Details:\n` +
        `--------------------------\n` +
        `Title: ${task.title}\n` +
        `Status: ${task.status}\n` +
        `Deadline: ${new Date(task.dueDate).toLocaleString()}\n\n` +
        `Please update the status once completed.\n\n` +
        `Regards,\n` +
        `TechnoGuide Team`;

      const notification = new Notification({
        message,
        type: 'Task Reminder',
        recipient: teamMember._id,
        recipientEmail: teamMember.email,
        recipientPhone: teamMember.phone,
        metadata: { taskId: task._id }
      });

      const result = await emailService.sendEmail(teamMember.email, subject, message);
      notification.status = result.success ? 'Sent' : 'Failed';
      if (!result.success) notification.error = result.error;

      await notification.save();
    } catch (error) {
      console.error('Error in sendTaskReminder:', error);
    }
  }

  /**
   * Send morning notification to team members or managers
   */
  async sendMorningNotification() {
    try {
      // 1. Check for unassigned tasks
      const unassignedTasksCount = await Task.countDocuments({ assignedTo: null });

      // Get all managers
      const managers = await Team.find({ role: 'Manager' });

      if (unassignedTasksCount > 0) {
        const subject = `📢 Morning Alert: Unassigned Tasks`;
        const adminMsg = `The system has detected unassigned tasks.\n\n` +
          `There are ${unassignedTasksCount} tasks that haven't been assigned yet today. Please assign them to team members as soon as possible.\n\n` +
          `Regards,\n` +
          `TechnoGuide System`;

        for (const manager of managers) {
          if (manager.email) {
            await this._sendDirectNotification(manager, adminMsg, 'Daily Summary', subject);
          }
        }
      } else {
        // If all tasks assigned, notify team members about their daily load
        const activeMembers = await Team.find({ email: { $exists: true } });
        for (const member of activeMembers) {
          const count = await Task.countDocuments({ assignedTo: member._id, status: { $ne: 'Completed' } });
          if (count > 0) {
            const subject = `☀️ Daily Task Summary`;
            const msg = `Good Morning, ${member.name}!\n\n` +
              `You have ${count} pending tasks for today. Have a productive day!\n\n` +
              `Regards,\n` +
              `TechnoGuide Team`;
            await this._sendDirectNotification(member, msg, 'Daily Summary', subject);
          }
        }
      }
    } catch (error) {
      console.error('Error in sendMorningNotification:', error);
    }
  }

  /**
   * Internal helper to send and save a notification
   */
  async _sendDirectNotification(recipient, message, type, subject) {
    const notification = new Notification({
      message,
      type,
      recipient: recipient._id,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      status: 'Pending'
    });

    const result = await emailService.sendEmail(recipient.email, subject || `Notification from TechnoGuide`, message);

    if (recipient.phone) {
      await whatsappService.sendMessage(recipient.phone, message);
    }

    notification.status = result.success ? 'Sent' : 'Failed';
    if (!result.success) notification.error = result.error;

    await notification.save();
  }

  /**
   * Notify managers about aggregated deliverable delays
   */
  async sendGroupedDeliveryAlerts(delayedItems) {
    try {
      if (!delayedItems || delayedItems.length === 0) return;

      const managers = await Team.find({ role: 'Manager' });
      if (!managers || managers.length === 0) return;

      const subject = `⚠️ Delivery Performance Alert: ${delayedItems.length} Delayed Service(s)`;

      let waMessage = `🚨 *Delivery Performance Alerts*\n\n`;
      waMessage += `The following clients are falling behind on their expected monthly deliverables:\n\n`;

      let htmlMessage = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #dc2626; margin-top: 0;">⚠️ Delivery Performance Alerts</h2>
          <p>The system has detected delays for the following services based on their package timelines:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px;">Client</th>
                <th style="padding: 10px;">Package</th>
                <th style="padding: 10px;">Service</th>
                <th style="padding: 10px;">Target</th>
                <th style="padding: 10px;">Completed</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Group by client for WhatsApp readability
      const groupedByClient = {};
      delayedItems.forEach(item => {
        if (!groupedByClient[item.clientName]) groupedByClient[item.clientName] = [];
        groupedByClient[item.clientName].push(item);
        
        // Build email row
        htmlMessage += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: bold;">${item.clientName}</td>
            <td style="padding: 10px; color: #475569;">${item.packageName}</td>
            <td style="padding: 10px;">${item.serviceName}</td>
            <td style="padding: 10px;">${item.target}</td>
            <td style="padding: 10px; color: #dc2626; font-weight: bold;">${item.completed}</td>
          </tr>
        `;
      });
      htmlMessage += `</tbody></table></div>`;

      // Build WhatsApp message array
      for (const [clientName, issues] of Object.entries(groupedByClient)) {
        waMessage += `🏢 *${clientName}*\n`;
        issues.forEach(issue => {
          waMessage += `🔹 _${issue.serviceName}_\n`;
          waMessage += `   Exp: ${issue.target} | Done: ${issue.completed}\n`;
        });
        waMessage += `--------------------------\n`;
      }
      
      waMessage += `\nPlease check the dashboard to assign resources.\n`;

      for (const manager of managers) {
        // Send WhatsApp
        if (manager.phone) {
          await whatsappService.sendMessage(manager.phone, waMessage);
        }
        // Send Email
        if (manager.email) {
          const notification = new Notification({
            message: waMessage,
            type: 'Package Alert',
            recipient: manager._id,
            recipientEmail: manager.email,
            recipientPhone: manager.phone,
            status: 'Pending'
          });
          
          const result = await emailService.sendEmail(manager.email, subject, waMessage, htmlMessage);
          
          notification.status = result.success ? 'Sent' : 'Failed';
          if (!result.success) notification.error = result.error;
          await notification.save();
        }
      }
    } catch (error) {
      console.error('Error in sendGroupedDeliveryAlerts:', error);
    }
  }

  /**
   * Notify about overdue tasks
   */
  async notifyOverdueTask(task) {
    try {
      const subject = `🚨 Overdue Task Alert: ${task.title}`;
      const managerMsg = `Overdue Task Alert\n\n` +
        `Task: ${task.title}\n` +
        `Assigned To: ${task.assignedTo?.name || 'Unassigned'}\n` +
        `Due Date: ${new Date(task.dueDate).toLocaleString()}\n\n` +
        `This task has passed its deadline.\n\n` +
        `Regards,\n` +
        `TechnoGuide Alert System`;

      const teamMsg = `Hello,\n\n` +
        `The task "${task.title}" is now overdue.\n` +
        `Deadline was: ${new Date(task.dueDate).toLocaleString()}\n\n` +
        `Please complete this task immediately and update the status in the dashboard.\n\n` +
        `Regards,\n` +
        `TechnoGuide Team`;

      // Notify Team Member
      if (task.assignedTo?.email) {
        await this._sendDirectNotification(task.assignedTo, teamMsg, 'Overdue Alert', subject);
      }

      // Notify Managers
      const managers = await Team.find({ role: 'Manager' });
      for (const manager of managers) {
        if (manager.email) {
          await this._sendDirectNotification(manager, managerMsg, 'Overdue Alert', subject);
        }
      }
    } catch (error) {
      console.error('Error in notifyOverdueTask:', error);
    }
  }
  constructor() {
    this.pendingAssignmentTimers = {};
  }

  /**
   * Helper to check if current time is within 9:00 AM to 7:00 PM.
   */
  isWithinWorkingHours() {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 9 && hours < 21;
  }

  /**
   * Notify team member about new task assignment(s).
   * @param {string} taskId - The ID of the task that was just assigned.
   * @param {boolean} instant - If true, send immediately without a buffer (used for manual requests).
   */
  async notifyTaskAssignment(taskId, instant = false) {
    try {
      if (!this.isWithinWorkingHours()) return null;

      const task = await Task.findById(taskId);
      if (!task || !task.assignedTo) return null;

      const userId = task.assignedTo.toString();

      // If manual trigger (instant), send immediately
      if (instant) {
        if (this.pendingAssignmentTimers[userId]) {
          clearTimeout(this.pendingAssignmentTimers[userId]);
          delete this.pendingAssignmentTimers[userId];
        }
        return await this.sendGroupedTaskAssignments(userId);
      }

      // If automated trigger, use a 1-minute buffer to group assignments
      if (this.pendingAssignmentTimers[userId]) {
        clearTimeout(this.pendingAssignmentTimers[userId]);
      }

      this.pendingAssignmentTimers[userId] = setTimeout(async () => {
        try {
          await this.sendGroupedTaskAssignments(userId);
          delete this.pendingAssignmentTimers[userId];
        } catch (err) {
          console.error('Error in deferred grouped notification:', err);
        }
      }, 60000);

      // Return a mock/partial for the controller to show it's "queued"
      return { status: 'Sent', message: 'Notification queued (1m buffer)' };
    } catch (error) {
      console.error('Error in notifyTaskAssignment trigger:', error);
      return null;
    }
  }

  /**
   * Called by the 9:00 AM Cron task.
   * Finds all tasks where notificationSent is false and grouping them by assignedTo.
   */
  async processPendingTaskAssignments() {
    try {
      const pendingTasks = await Task.find({
        notificationSent: false,
        status: { $in: ['Pending', 'In Progress'] },
        assignedTo: { $ne: null }
      }).distinct('assignedTo');

      if (!pendingTasks || pendingTasks.length === 0) return;

      for (const userId of pendingTasks) {
        await this.sendGroupedTaskAssignments(userId.toString());
      }
    } catch (error) {
      console.error('Error in processPendingTaskAssignments:', error);
    }
  }

  /**
   * Collect all un-notified tasks for a user and send a single summary.
   * Returns the saved Notification record.
   */
  async sendGroupedTaskAssignments(userId) {
    const tasks = await Task.find({
      assignedTo: userId,
      notificationSent: false,
      status: { $in: ['Pending', 'In Progress'] }
    }).populate('assignedTo client package').sort({ createdAt: 1 });

    if (tasks.length === 0) return null;

    const teamMember = tasks[0].assignedTo;
    if (!teamMember || !teamMember.phone) return null;

    const eWave = String.fromCodePoint(0x1F44B);
    const divider = '━━━━━━━━━━━━━━━━━━━';

    let waMessage = `📌 *Task Assignment Summary*\n\n`;
    waMessage += `Hello *${teamMember.name}* ${eWave}\n`;
    waMessage += `You have been assigned *${tasks.length} new task(s)* in TechnoGuide.\n\n`;
    waMessage += `${divider}\n\n`;

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #ea580c; margin-top: 0;">📌 Task Assignment Summary</h2>
        <p>Hello <strong>${teamMember.name}</strong>,</p>
        <p>You have been assigned <strong>${tasks.length} new task(s)</strong> in TechnoGuide.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    `;

    tasks.forEach((task, index) => {
      const dueDate = new Date(task.dueDate);
      const dueStr = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' +
        dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      waMessage += `📂 *Task ${index + 1}*\n`;
      waMessage += `--------------------------\n`;
      waMessage += `*Title:* ${task.title}\n`;
      waMessage += `*Client:* ${task.client.name}\n`;
      waMessage += `*Due:* ${dueStr}\n`;
      waMessage += `*Priority:* ${task.priority}\n`;

      if (task.impactedDeliverables && task.impactedDeliverables.length > 0) {
        waMessage += `*📦 Deliverables:*\n`;
        task.impactedDeliverables.forEach(del => {
          waMessage += `- ${del.name}: ${del.count}\n`;
        });
      }
      waMessage += `\n`;

      if (task.instructions) {
        waMessage += `📝 Instructions:\n${task.instructions}\n\n`;
      }

      if (task.taskDetails && task.taskDetails.length > 0) {
        waMessage += `📌 Milestones:\n`;
        task.taskDetails.forEach(detail => {
          waMessage += `- ${detail}\n`;
        });
        waMessage += `\n`;
      }

      if (task.referenceFiles && task.referenceFiles.length > 0) {
        waMessage += `📎 Files:\n`;
        task.referenceFiles.forEach(file => {
          waMessage += `- ${file.originalName}\n`;
        });
        waMessage += `\n`;
      }

      waMessage += `${divider}\n\n`;

      emailHtml += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
          <h3 style="margin-top: 0; color: #0f172a;">Task ${index + 1}: ${task.title}</h3>
          <p><strong>Client:</strong> ${task.client.name}</p>
          <p><strong>Due Date:</strong> ${dueStr}</p>
          <p><strong>Priority:</strong> <span style="font-weight: bold; color: ${task.priority === 'High' ? '#dc2626' : '#1d4ed8'};">${task.priority}</span></p>
          ${task.impactedDeliverables && task.impactedDeliverables.length > 0 ? `
            <p><strong>Deliverables:</strong></p>
            <ul style="padding-left: 20px; list-style-type: disc; color: #475569; margin: 5px 0;">
              ${task.impactedDeliverables.map(del => `<li>${del.name}: <strong>${del.count}</strong></li>`).join('')}
            </ul>
          ` : ''}
          ${task.instructions ? `<p><strong>Instructions:</strong> ${task.instructions}</p>` : ''}
          ${task.taskDetails && task.taskDetails.length > 0 ? `
            <p><strong>Milestones:</strong></p>
            <ul style="padding-left: 20px; list-style-type: square; color: #475569;">
              ${task.taskDetails.map(d => `<li>${d}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    });

    waMessage += `📊 *Summary*\n`;
    waMessage += `Total Tasks: ${tasks.length}\n\n`;
    waMessage += `⚠️ Please complete tasks within the deadline.\n\n`;
    waMessage += `*Regards,*\n*TechnoGuide Team*`;

    emailHtml += `
        <div style="margin-top: 20px; background: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fde68a;">
           <p style="margin: 0; color: #92400e;">⚠️ <strong>Deadline Reminder:</strong> Please ensure all tasks are completed within the specified timelines.</p>
        </div>
        <p style="margin-top: 30px;">Regards,<br><strong>TechnoGuide Team</strong></p>
      </div>
    `;

    // Send alerts
    if (teamMember.email) {
      await emailService.sendEmail(teamMember.email, `📌 Task Assignment Summary: ${tasks.length} New Tasks`, waMessage, emailHtml);
    }

    if (teamMember.phone) {
      await whatsappService.sendMessage(teamMember.phone, waMessage);
    }

    const notification = new Notification({
      message: waMessage,
      type: 'Task Assignment',
      recipient: teamMember._id,
      recipientPhone: teamMember.phone,
      status: 'Sent'
    });
    const savedNotification = await notification.save();

    // Mark tasks as notified
    await Task.updateMany(
      { _id: { $in: tasks.map(t => t._id) } },
      { notificationSent: true }
    );

    return savedNotification;
  }

  /**
   * Send a reminder for a pending task.
   */
  async sendTaskReminder(task, timeLeftHrs) {
    try {
      if (!this.isWithinWorkingHours()) return;
      if (!task.assignedTo || !task.assignedTo.phone) return;

      const eAlarm = String.fromCodePoint(0x23F0);
      const totalMinutes = Math.round(timeLeftHrs * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const timeLeftStr = timeLeftHrs <= 0 ? 'Deadline Reached' : (h > 0 ? `${h} Hour(s) ${m} Minute(s)` : `${m} Minute(s)`);

      let waMessage = `*${eAlarm} Reminder: Task Pending*\n\n`;
      waMessage += `*Client:* ${task.client.name}\n`;
      waMessage += `*Task:* ${task.title}\n`;
      waMessage += `*Time Left:* ${timeLeftStr}\n\n`;
      waMessage += `Please complete the task immediately.`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #dc2626; margin-top: 0;">⏰ Reminder: Task Pending</h2>
          <div style="background: #fff5f5; padding: 15px; border-radius: 8px; border: 1px solid #feb2b2;">
            <p><strong>Client:</strong> ${task.client.name}</p>
            <p><strong>Task:</strong> ${task.title}</p>
            <p><strong>Time Left:</strong> ${timeLeftStr}</p>
          </div>
        </div>
      `;

      if (task.assignedTo.email) {
        await emailService.sendEmail(task.assignedTo.email, `⏰ Task Reminder: ${task.client.name}`, waMessage, emailHtml);
      }

      if (task.assignedTo.phone) {
        await whatsappService.sendMessage(task.assignedTo.phone, waMessage);
      }

      await new Notification({
        message: waMessage,
        type: 'Task Reminder',
        recipient: task.assignedTo._id,
        recipientPhone: task.assignedTo.phone,
        status: 'Sent'
      }).save();

      await Task.findByIdAndUpdate(task._id, { $inc: { remindersSent: 1 } });
    } catch (error) {
      console.error('Error in sendTaskReminder:', error);
    }
  }

  /**
   * Calculate how many days/hours/weeks a client task is pending.
   * Logic:
   * 1. Check last task assignment from Task model.
   * 2. Check last completed task from TaskHistory model.
   * 3. Fallback to client creation date.
   */
  async calculatePendingDays(clientId) {
    try {
      const now = new Date();
      const mongoose = require('mongoose');

      // Ensure clientId is an ObjectId
      const clientObjectId = typeof clientId === 'string' ? new mongoose.Types.ObjectId(clientId) : clientId;

      // 1. Get latest task assignment (Active)
      const lastTask = await Task.findOne({ client: clientObjectId })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();

      // 2. Get latest assignment from history
      // We look for assignedDate first, but fallback to createdAt or dueDate for older records
      const lastHistory = await TaskHistory.findOne({ client: clientObjectId })
        .sort({ assignedDate: -1, createdAt: -1 })
        .select('assignedDate createdAt dueDate')
        .lean();

      let lastActivityDate = null;

      const tDate = lastTask ? new Date(lastTask.createdAt) : null;

      // Smart History Date Fallback: Priority order: assignedDate -> createdAt -> dueDate
      let hDate = null;
      if (lastHistory) {
        const d1 = lastHistory.assignedDate ? new Date(lastHistory.assignedDate) : null;
        const d2 = lastHistory.createdAt ? new Date(lastHistory.createdAt) : null;
        const d3 = lastHistory.dueDate ? new Date(lastHistory.dueDate) : null;

        // Pick the first valid date in order of reliability
        hDate = (d1 && !isNaN(d1.getTime())) ? d1 :
          (d2 && !isNaN(d2.getTime())) ? d2 :
            (d3 && !isNaN(d3.getTime())) ? d3 : null;
      }

      // Filter and compare valid timestamps
      const tTime = (tDate && !isNaN(tDate.getTime())) ? tDate.getTime() : 0;
      const hTime = (hDate && !isNaN(hDate.getTime())) ? hDate.getTime() : 0;

      if (tTime > 0 || hTime > 0) {
        lastActivityDate = tTime > hTime ? new Date(tTime) : new Date(hTime);
      }

      // 3. Fallback to client created date if no tasks found at all
      if (!lastActivityDate) {
        const client = await Client.findById(clientObjectId).select('createdAt').lean();
        if (client && client.createdAt && !isNaN(new Date(client.createdAt).getTime())) {
          lastActivityDate = new Date(client.createdAt);
        }
      }

      // Final fallback to now if everything else fails
      if (!lastActivityDate || isNaN(lastActivityDate.getTime())) {
        lastActivityDate = now;
      }

      const diffMs = now.getTime() - lastActivityDate.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      const diffDays = diffHrs / 24;
      const diffWeeks = diffDays / 7;

      if (diffWeeks >= 1) {
        return { value: Math.floor(diffWeeks), unit: 'Week(s)', date: lastActivityDate };
      } else if (diffDays >= 1) {
        return { value: Math.floor(diffDays), unit: 'Day(s)', date: lastActivityDate };
      } else {
        return { value: Math.max(1, Math.floor(diffHrs)), unit: 'Hour(s)', date: lastActivityDate };
      }
    } catch (error) {
      console.error(`Error in calculatePendingDays for client ${clientId}:`, error);
      return { value: 0, unit: 'Today', date: new Date() };
    }
  }

  /**
   * Scheduled report for pending clients.
   * Updated to use accurate pendingDays calculation.
   */
  async sendPendingAlerts() {
    try {
      if (!this.isWithinWorkingHours()) return;

      const allClients = await Client.find({});
      const activeTasks = await Task.find({
        status: { $ne: 'Completed' }
      });

      // A client is pending if they have NO active tasks
      const pendingClients = [];
      for (const client of allClients) {
        const hasActiveTask = activeTasks.some(t => t.client?.toString() === client._id.toString());
        if (!hasActiveTask) {
          pendingClients.push(client);
        }
      }

      if (pendingClients.length === 0) return;

      const managers = await Team.find({ role: 'Manager' });
      if (!managers || managers.length === 0) return;

      const eChart = String.fromCodePoint(0x1F4CA);
      let waMessage = `*${eChart} Pending Task Report*\n\n`;
      waMessage += `*Total Pending Clients:* ${pendingClients.length}\n\n`;

      for (let i = 0; i < pendingClients.length; i++) {
        const client = pendingClients[i];
        const pendingInfo = await this.calculatePendingDays(client._id);
        const dateStr = pendingInfo.date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        waMessage += `${i + 1}️⃣ ${client.name} – Last Assignment Date: ${dateStr}\n`;
      }

      for (const manager of managers) {
        if (manager.email) {
          const subject = `📊 Pending Task Report: ${pendingClients.length} Clients`;
          await emailService.sendEmail(manager.email, subject, waMessage);
        }

        if (manager.phone) {
          await whatsappService.sendMessage(manager.phone, waMessage);
        }

        await new Notification({
          message: waMessage,
          type: 'Unassigned Alert',
          recipient: manager._id,
          recipientPhone: manager.phone,
          status: 'Pending'
        }).save();
      }
    } catch (error) {
      console.error('Error in sendPendingAlerts:', error);
    }
  }
}

module.exports = new NotificationService();
