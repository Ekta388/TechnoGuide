const nodemailer = require('nodemailer');

/**
 * Email Service for TechnoGuide
 * Handles sending automated notifications via Gmail.
 */
class EmailService {
  constructor() {
    this.user = 'ektarana388@gmail.com';
    this.pass = 'qwlv ohhw ziuz yhjw';
    this.appName = 'TechnoGuide';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.user,
        pass: this.pass
      }
    });

    this.from = `${this.appName} <${this.user}>`;
  }

  /**
   * Send an email
   * @param {string} to - Recipient email
   * @param {string} subject - Subject line
   * @param {string} text - Plain text body
   * @param {string} html - HTML body (optional)
   * @returns {Promise<object>} - Response
   */
  async sendEmail(to, subject, text, html, attachments = []) {
    try {
      if (!this.transporter) {
        throw new Error('Email credentials not configured');
      }

      console.log(`[Email] Sending to: ${to}, Subject: ${subject}`);

      const mailOptions = {
        from: this.from,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Info: ${info.messageId}`);

      return {
        success: true,
        data: info,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Email Service Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
