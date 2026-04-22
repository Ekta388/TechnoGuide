const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCodeImage = require('qrcode');

class WhatsAppService {
  constructor() {
    this.isReady = false;
    this.currentQrUrl = null;
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--no-zygote',
          '--no-first-run',
          '--single-process',
          '--disable-accelerated-2d-canvas',
          '--js-flags="--max-old-space-size=384"'
        ],
        timeout: 90000
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1012590139.html',
      }
    });

    this.client.on('qr', async (qr) => {
      console.log('==================================================');
      console.log('SCAN THIS QR CODE WITH YOUR COMPANY WHATSAPP:');
      qrcode.generate(qr, { small: true });
      console.log(`OR OPEN: http://localhost:5000/api/whatsapp/status TO SCAN`);
      console.log('==================================================');
      
      try {
        this.currentQrUrl = await QRCodeImage.toDataURL(qr);
      } catch (err) {
        console.error('Failed to generate Base64 QR code image', err);
      }
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp Client is ready!');
      this.isReady = true;
      this.currentQrUrl = null;
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp authenticated successfully!');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('WhatsApp authentication failure:', msg);
      this.isReady = false;
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client was disconnected:', reason);
      this.isReady = false;
    });

    // Start initialization with retry
    this.initialize();
  }

  async initialize(retryCount = 0) {
    const maxRetries = 3;
    console.log(`[WhatsApp] Initializing (Attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    try {
      await this.client.initialize();
    } catch (err) {
      console.error(`[WhatsApp] Initialization attempt ${retryCount + 1} failed:`, err.message);
      
      if (retryCount < maxRetries) {
        console.log(`[WhatsApp] Retrying in 10 seconds...`);
        setTimeout(() => this.initialize(retryCount + 1), 10000);
      } else {
        console.error('[WhatsApp] Max initialization retries reached. Please check server resources or clear .wwebjs_auth folder.');
      }
    }
  }

  async sendMessage(phone, message) {
    if (!this.isReady) {
      console.warn(`[WhatsApp] Client not ready yet. Failed to send message to ${phone}`);
      return { success: false, error: 'WhatsApp client not ready' };
    }

    try {
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
      
      const chatId = cleanPhone + '@c.us';

      await this.client.sendMessage(chatId, message);
      console.log(`[WhatsApp] Message successfully sent to ${cleanPhone}`);

      return {
        success: true,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('WhatsApp Service Send Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a template-based message
   * Since `whatsapp-web.js` doesn't do official templates, we fallback to text
   */
  async sendTemplate(phone, templateName, variables) {
    console.log(`[WhatsApp Fallback] Template: ${templateName} to ${phone}`);
    return this.sendMessage(phone, `Template triggered: ${templateName}. Variables: ${JSON.stringify(variables)}`);
  }
}

module.exports = new WhatsAppService();