const cron = require('node-cron');
const { DateTime } = require('luxon');
const Assignment = require('../models/Assignment');
const emailService = require('./emailService');

/**
 * Expiry Cron Service
 * Checks daily for assignments that expire today or in exactly 7 days.
 */
const checkExpirations = async () => {
  console.log('[ExpiryCron] Checking for expiring assignments...');
  try {
    const today = DateTime.now().setZone('Asia/Kolkata').startOf('day');
    const in7Days = today.plus({ days: 7 });

    const targetDates = [
      { date: today, label: 'Today' },
      { date: in7Days, label: 'in 7 Days' }
    ];

    for (const target of targetDates) {
      const startOfDay = target.date.toJSDate();
      const endOfDay = target.date.endOf('day').toJSDate();

      const assignments = await Assignment.find({
        endDate: { $gte: startOfDay, $lte: endOfDay }
      }).populate('client package');

      console.log(`[ExpiryCron] Found ${assignments.length} assignments expiring ${target.label}`);

      for (const assignment of assignments) {
        if (assignment.client && assignment.client.email) {
          await sendExpiryEmail(assignment, target.label);
        }
      }
    }
  } catch (error) {
    console.error('[ExpiryCron] Error in checkExpirations:', error);
  }
};

/**
 * Sends a professional expiry notification email to the client.
 */
const sendExpiryEmail = async (assignment, timeline) => {
  const { client, package: pkg, deliverablesProgress } = assignment;
  const subject = `⚠️ Package Expiry Alert: ${pkg.name} (${timeline})`;

  let deliverablesHtml = '';
  if (deliverablesProgress && deliverablesProgress.length > 0) {
    deliverablesHtml = `
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📦 Deliverable Status</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${deliverablesProgress.map(d => `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>${d.name}:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${d.completedCount} / ${d.total}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #ea580c; margin-top: 0;">⚠️ Package Expiry Notification</h2>
      <p>Hello <strong>${client.name}</strong>,</p>
      <p>This is a formal update that your subscription for the <strong>${pkg.name}</strong> package is set to expire <strong>${timeline === 'Today' ? 'today' : 'in 7 days'}</strong> (${DateTime.fromJSDate(assignment.endDate).toLocaleString(DateTime.DATE_MED)}).</p>
      
      ${deliverablesHtml}
      
      <p>To ensure continuity of your active services, please reach out to our team at your earliest convenience to discuss renewal options.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Regards,<br><strong>TechnoGuide Team</strong></p>
    </div>
  `;

  const textMessage = `Hello ${client.name},\n\nYour package "${pkg.name}" is expiring ${timeline === 'Today' ? 'today' : 'in 7 days'}.\n\nDeliverable status:\n${(deliverablesProgress || []).map(d => `- ${d.name}: ${d.completedCount}/${d.total}`).join('\n')}\n\nPlease contact us for renewal.\n\nRegards,\nTechnoGuide Team`;

  await emailService.sendEmail(client.email, subject, textMessage, htmlMessage);
};

// Start the cron job: Daily at 9:00 AM
cron.schedule('0 9 * * *', checkExpirations);

module.exports = {
  init: () => {
    console.log('📬 ExpiryCron Background Service: Scheduled Daily @ 09:00');
  },
  checkExpirations // Exported for manual testing
};
