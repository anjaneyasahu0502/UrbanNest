const nodemailer = require('nodemailer');

// Email transporter configuration
let emailTransporter = null;

function getEmailTransporter() {
  if (!emailTransporter && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return emailTransporter;
}

// Send OTP via Email
async function sendEmailOTP(email, otp) {
  try {
    const transporter = getEmailTransporter();
    
    if (!transporter) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email not configured. OTP for', email);
      console.log('🔐 OTP:', otp);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, message: 'Email service not configured. Check console for OTP.' };
    }

    const mailOptions = {
      from: `"UrbanNest" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification Code - UrbanNest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(to right, #FF9933 0%, #FFFFFF 50%, #138808 100%); padding: 20px; border-radius: 10px;">
            <h1 style="color: #000080; margin: 0; font-size: 32px;">🏙️ UrbanNest</h1>
            <p style="color: #333; margin: 5px 0; font-weight: 600;">India's Premier Urban Accommodation Platform</p>
          </div>
          
          <div style="background-color: #FFF5E6; border-radius: 10px; padding: 30px; margin-bottom: 20px; border: 2px solid #FF9933;">
            <h2 style="color: #000080; margin-top: 0;">🙏 Namaste! Email Verification</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Thank you for joining <strong>UrbanNest</strong>! To complete your registration and start exploring India's finest urban accommodations, please use the verification code below:
            </p>
            
            <div style="background: linear-gradient(135deg, #FFF 0%, #FFE6CC 100%); border: 3px solid #FF9933; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(255, 153, 51, 0.2);">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
              <h1 style="color: #FF9933; font-size: 52px; letter-spacing: 18px; margin: 10px 0; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                ${otp}
              </h1>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 2px dashed #FF9933;">
                <span style="display: inline-block; width: 12px; height: 12px; background: #FF9933; border-radius: 50%; margin: 0 3px;"></span>
                <span style="display: inline-block; width: 12px; height: 12px; background: #FFFFFF; border-radius: 50%; margin: 0 3px; border: 2px solid #FF9933;"></span>
                <span style="display: inline-block; width: 12px; height: 12px; background: #138808; border-radius: 50%; margin: 0 3px;"></span>
              </div>
            </div>
            
            <div style="background-color: #FFF3CD; border-left: 5px solid #FF9933; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏰ Important:</strong> This code will expire in 10 minutes. Please verify soon!
              </p>
            </div>
            
            <div style="background-color: #D4EDDA; border-left: 5px solid #138808; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>🔒 Security Note:</strong> All digits in this code are unique for enhanced security.
              </p>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #FFF5E6, #FFE6CC); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #FF9933;">
            <h3 style="color: #FF9933; font-size: 16px; margin-top: 0;">🌟 Why Choose UrbanNest?</h3>
            <ul style="color: #333; font-size: 14px; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
              <li>🏙️ Premium properties in India's major cities</li>
              <li>💻 Close to IT hubs and business districts</li>
              <li>🤖 AI-powered Sahayata assistant for travel tips</li>
              <li>✅ Verified listings with instant booking</li>
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 13px; margin: 0; text-align: center;">
              If you didn't request this verification code, please ignore this email or contact our support team.
            </p>
          </div>
          
          <hr style="border: none; border-top: 2px solid #FF9933; margin: 30px 0;">
          
          <div style="text-align: center;">
            <div style="margin-bottom: 15px;">
              <span style="display: inline-block; width: 30px; height: 5px; background: #FF9933; margin: 0 2px;"></span>
              <span style="display: inline-block; width: 30px; height: 5px; background: #FFFFFF; border: 1px solid #ccc; margin: 0 2px;"></span>
              <span style="display: inline-block; width: 30px; height: 5px; background: #138808; margin: 0 2px;"></span>
            </div>
            <p style="color: #000080; font-size: 14px; margin: 5px 0; font-weight: 600;">
              🏙️ UrbanNest - India's Urban Accommodation Platform
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
              This is an automated email. Please do not reply to this message.
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
              © ${new Date().getFullYear()} UrbanNest. Made with ❤️ in India. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
UrbanNest - Email Verification

Namaste! 🙏

Your verification code is: ${otp}

⏰ This code will expire in 10 minutes.
🔒 All digits in this code are unique for enhanced security.

Why Choose UrbanNest?
- Premium properties in India's major cities
- Close to IT hubs and business districts
- AI-powered Sahayata assistant for travel tips
- Verified listings with instant booking

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} UrbanNest. Made with ❤️ in India. All rights reserved.
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Email OTP sent to:', email);
    return { success: true, message: 'OTP sent to email successfully' };
  } catch (error) {
    console.error('Email OTP error:', error);
    // Fallback: log OTP to console in development
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Email service error. OTP for', email);
    console.log('🔐 OTP:', otp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Email service error. Check console for OTP.' };
  }
}

module.exports = {
  sendEmailOTP,
};
