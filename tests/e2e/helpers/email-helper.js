const { FreecustomEmailClient } = require('freecustom-email');

class EmailHelper {
  constructor() {
    this.client = null;
    if (process.env.FCE_API_KEY) {
      this.client = new FreecustomEmailClient({ 
        apiKey: process.env.FCE_API_KEY 
      });
    }
  }

  /**
   * Generate a unique test email address
   */
  generateTestEmail() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `pw-test-${timestamp}-${random}@ditapi.info`;
  }

  /**
   * Register a test inbox with FreeCustom.email
   */
  async registerInbox(email) {
    if (!this.client) {
      console.warn('FreeCustom.email client not initialized. Set FCE_API_KEY environment variable.');
      return false;
    }

    try {
      await this.client.inboxes.register(email, true);
      await this.client.inboxes.startTest(email, 'e2e-signup-test');
      console.log(`✓ Registered test inbox: ${email}`);
      return true;
    } catch (error) {
      console.error(`✗ Failed to register inbox ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Wait for and retrieve OTP from email
   */
  async waitForOTP(email, options = {}) {
    if (!this.client) {
      console.warn('FreeCustom.email client not initialized. Returning fallback OTP.');
      return '123456';
    }

    const {
      timeoutMs = 30000,
      subject = 'Email Verification OTP',
      retries = 3
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Waiting for OTP (attempt ${attempt}/${retries})...`);
        const otp = await this.client.otp.waitFor(email, { 
          timeoutMs,
          subject 
        });
        console.log(`✓ Received OTP: ${otp}`);
        return otp;
      } catch (error) {
        console.warn(`✗ Attempt ${attempt} failed:`, error.message);
        if (attempt === retries) {
          console.error('All attempts to retrieve OTP failed. Using fallback.');
          return '123456'; // Fallback OTP
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Get all emails for an inbox
   */
  async getEmails(email, options = {}) {
    if (!this.client) {
      console.warn('FreeCustom.email client not initialized.');
      return [];
    }

    try {
      const emails = await this.client.inboxes.getEmails(email, options);
      return emails;
    } catch (error) {
      console.error('Failed to get emails:', error.message);
      return [];
    }
  }

  /**
   * Clean up test inbox
   */
  async cleanupInbox(email) {
    if (!this.client) {
      return;
    }

    try {
      await this.client.inboxes.delete(email);
      console.log(`✓ Cleaned up inbox: ${email}`);
    } catch (error) {
      console.warn(`Failed to cleanup inbox ${email}:`, error.message);
    }
  }

  /**
   * Extract OTP from email content
   */
  extractOTPFromContent(content) {
    // Look for 6-digit numbers in the content
    const otpPattern = /\b\d{6}\b/g;
    const matches = content.match(otpPattern);
    return matches ? matches[0] : null;
  }

  /**
   * Wait for email with specific subject
   */
  async waitForEmail(email, subject, timeoutMs = 30000) {
    if (!this.client) {
      console.warn('FreeCustom.email client not initialized.');
      return null;
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      try {
        const emails = await this.getEmails(email, { limit: 10 });
        const matchingEmail = emails.find(e => 
          e.subject && e.subject.includes(subject)
        );
        
        if (matchingEmail) {
          console.log(`✓ Found email with subject: ${subject}`);
          return matchingEmail;
        }
      } catch (error) {
        console.warn('Error checking emails:', error.message);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.warn(`Timeout waiting for email with subject: ${subject}`);
    return null;
  }
}

module.exports = { EmailHelper };
