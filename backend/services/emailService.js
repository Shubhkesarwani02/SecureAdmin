const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if email configuration is available
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    // Only initialize if we have the required config
    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransporter(emailConfig);
      console.log('📧 Email service initialized');
    } else {
      console.log('📧 Email service not configured - using console output for development');
    }
  }

  async sendInvitationEmail(email, inviteData) {
    const { fullName, role, onboardingUrl, inviterName, companyName, expiresAt } = inviteData;

    const subject = `You're invited to join ${companyName || 'Framtt Platform'}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Framtt Platform</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName || email}!</h2>
            <p>You've been invited by ${inviterName} to join ${companyName || 'Framtt Platform'} as a <strong>${role.toUpperCase()}</strong>.</p>
            
            <p>To complete your registration and set up your account, please click the button below:</p>
            
            <p style="text-align: center;">
              <a href="${onboardingUrl}" class="button">Complete Registration</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${onboardingUrl}
            </p>
            
            <p><strong>Important:</strong> This invitation will expire on ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}.</p>
            
            <p>If you have any questions, please contact your administrator or reply to this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Framtt Platform. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to Framtt Platform!
      
      Hello ${fullName || email}!
      
      You've been invited by ${inviterName} to join ${companyName || 'Framtt Platform'} as a ${role.toUpperCase()}.
      
      To complete your registration and set up your account, please visit:
      ${onboardingUrl}
      
      Important: This invitation will expire on ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}.
      
      If you have any questions, please contact your administrator.
      
      This is an automated email from Framtt Platform.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Framtt Platform" <noreply@framtt.com>',
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      if (this.transporter) {
        const result = await this.transporter.sendMail(mailOptions);
        console.log(`📧 Invitation email sent to ${email}:`, result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        // Development mode - log to console
        console.log('\n📧 DEVELOPMENT MODE - Email would be sent:');
        console.log('To:', email);
        console.log('Subject:', subject);
        console.log('Invitation URL:', onboardingUrl);
        console.log('Expires:', new Date(expiresAt).toLocaleString());
        console.log('───────────────────────────────────\n');
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }
    } catch (error) {
      console.error('📧 Error sending invitation email:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, resetData) {
    const { resetUrl, expiresAt } = resetData;

    const subject = 'Password Reset Request - Framtt Platform';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your Framtt Platform account.</p>
            
            <p>To reset your password, please click the button below:</p>
            
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
            
            <p><strong>Important:</strong> This reset link will expire on ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}.</p>
            
            <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Framtt Platform. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Password Reset Request - Framtt Platform
      
      We received a request to reset your password for your Framtt Platform account.
      
      To reset your password, please visit:
      ${resetUrl}
      
      Important: This reset link will expire on ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}.
      
      If you did not request this password reset, please ignore this email and your password will remain unchanged.
      
      This is an automated email from Framtt Platform.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Framtt Platform" <noreply@framtt.com>',
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      if (this.transporter) {
        const result = await this.transporter.sendMail(mailOptions);
        console.log(`📧 Password reset email sent to ${email}:`, result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        // Development mode - log to console
        console.log('\n📧 DEVELOPMENT MODE - Password reset email would be sent:');
        console.log('To:', email);
        console.log('Subject:', subject);
        console.log('Reset URL:', resetUrl);
        console.log('Expires:', new Date(expiresAt).toLocaleString());
        console.log('───────────────────────────────────\n');
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }
    } catch (error) {
      console.error('📧 Error sending password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  // Test email configuration
  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      console.error('Email service test failed:', error);
      return { success: false, message: `Email service test failed: ${error.message}` };
    }
  }
}

module.exports = new EmailService();
