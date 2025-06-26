import nodemailer from 'nodemailer';

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

export interface EmailData {
  firstName: string;
  lastName: string;
  email: string;
  experience: string;
  registrationDate: string;
  waitingListStatus?: 'active' | 'confirmed' | 'none';
}

export const sendRegistrationConfirmation = async (data: EmailData): Promise<void> => {
  try {
    const fromEmail = process.env.GMAIL_FROM_EMAIL || 'towerswingwcs@gmail.com';
    const isWaitingList = data.waitingListStatus === 'active';
    
    const mailOptions = {
      from: `Tower Swing <${fromEmail}>`,
      to: data.email,
      subject: isWaitingList ? '⏳ You\'re on the Waiting List - Tower Swing Registration' : '🎉 Welcome to Tower Swing - Registration Confirmed!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: ${isWaitingList ? '#ff9800' : '#667eea'}; text-align: center;">
            ${isWaitingList ? '⏳ You\'re on the Waiting List!' : '🎉 Welcome to Tower Swing!'}
          </h1>
          
          <h2>Hi ${data.firstName}!</h2>
          
          ${isWaitingList ? `
            <p>Thank you for your interest in Tower Swing! We've received your registration, but unfortunately, the event is currently at full capacity.</p>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <h3>📋 Your Registration Details:</h3>
              <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Experience Level:</strong> ${data.experience}</p>
              <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Waiting List</span></p>
            </div>
            
            <h3>⏰ What Happens Next?</h3>
            <ul>
              <li>We'll notify you immediately if a spot becomes available</li>
              <li>You'll have 24 hours to confirm and pay if a spot opens up</li>
              <li>We'll keep you updated on any changes</li>
            </ul>
          ` : `
            <p>Thank you for registering for the highest West Coast Swing event in Helsinki! We're excited to have you join us for an unforgettable dancing experience.</p>
            
            <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>📋 Registration Details:</h3>
              <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Experience Level:</strong> ${data.experience}</p>
              <p><strong>Event Date:</strong> June 28, 2025</p>
              <p><strong>Event Time:</strong> 16:00 - 23:45</p>
              <p><strong>Spa Opens:</strong> 20:00</p>
              <p><strong>Venue:</strong> Floor 33, REDI Shopping Centre, Helsinki</p>
              <p><strong>Price:</strong> €15</p>
            </div>
            
            <h3>💳 Payment Information:</h3>
            <p>Your registration is currently <strong>pending payment</strong>. Please complete your payment of €15 to confirm your spot.</p>
            
            <p><strong>Payment Method:</strong></p>
            <ul>
              <li>MobilePay to 045 319 7747 (Miika Aspiala) by June 10th</li>
            </ul>
          `}
          
          <h3>🎫 Event Details:</h3>
          <ul>
            <li><strong>Date:</strong> June 28, 2025</li>
            <li><strong>Time:</strong> 16:00 - 23:45</li>
            <li><strong>Venue:</strong> Floor 33, REDI Shopping Centre, Helsinki</li>
            <li><strong>Price:</strong> €15</li>
          </ul>
          
          ${!isWaitingList ? `
            <h3>🎵 What to Expect:</h3>
            <ul>
              <li>Dancing with stunning city views from floor 33</li>
              <li>Floor 33 club room, sauna, hot tub and magnificent terrace</li>
              <li>Music playing both inside and outside</li>
              <li>Meet fellow West Coast Swing enthusiasts</li>
              <li>Food and drinks available throughout the event</li>
              <li>Both club room and terrace are danceable areas</li>
            </ul>
            
            <h3>🎒 What to Bring:</h3>
            <ul>
              <li>Dance shoes</li>
              <li>Bathing suit</li>
              <li>Towel</li>
            </ul>
          ` : `
            <p>Don't worry - we'll be in touch as soon as there's any movement on the waiting list!</p>
          `}
          
          <p>We can't wait to see you on the dance floor!</p>
          
          <p>Best regards,<br>
          The Tower Swing Team</p>
          
          <hr style="margin: 30px 0;">
          <p style="text-align: center; color: #666; font-size: 14px;">© 2025 Tower Swing. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ ${isWaitingList ? 'Waiting list' : 'Registration'} confirmation email sent to ${data.email}`);
  } catch (error) {
    console.error('❌ Error sending registration confirmation email:', error);
    console.error('Gmail SMTP Error Details:', {
      user: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_PASSWORD,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('Failed to send confirmation email');
  }
};

export const sendPaymentConfirmation = async (data: EmailData): Promise<void> => {
  try {
    const fromEmail = process.env.GMAIL_FROM_EMAIL || 'towerswingwcs@gmail.com';
    const doorCode = process.env.DOOR_CODE || 'TBD';
    
    const mailOptions = {
      from: `Tower Swing <${fromEmail}>`,
      to: data.email,
      subject: '✅ Payment Confirmed - See you at Tower Swing!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4CAF50; text-align: center;">✅ Payment Confirmed!</h1>
          
          <h2>Hi ${data.firstName}!</h2>
          
          <p>Great news! Your payment of €15 has been received and your registration for Tower Swing is now <strong>confirmed</strong>.</p>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>🎫 Your Spot is Reserved!</h3>
            <p>You're all set for the highest West Coast Swing event in Helsinki on <strong>June 28, 2025</strong>.</p>
          </div>
          
          <h3>📅 Event Details:</h3>
          <ul>
            <li><strong>Date:</strong> June 28, 2025</li>
            <li><strong>Time:</strong> 16:00 - 23:45</li>
            <li><strong>Venue:</strong> Floor 33, REDI Shopping Centre, Helsinki</li>
            <li><strong>Address:</strong> Kalasatamankatu 9 A</li>
            <li><strong>Experience Level:</strong> ${data.experience}</li>
          </ul>
          
          <h3>🚪 Door Access:</h3>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Door Code:</strong> <span style="font-family: monospace; font-size: 18px; background: #f8f9fa; padding: 5px 10px; border-radius: 3px;">${doorCode}</span></p>
            <p><strong>⚠️ Important:</strong> This door code works only during the event. Please do not share it with anyone.</p>
          </div>
          
          <h3>🎵 What's Next?</h3>
          <p>Just show up on the day with your dancing shoes! No need to bring a printed ticket - we'll have your name on our guest list.</p>
          
          <p>We're excited to see you on the dance floor!</p>
          
          <p>Best regards,<br>
          The Tower Swing Team</p>
          
          <hr style="margin: 30px 0;">
          <p style="text-align: center; color: #666; font-size: 14px;">© 2025 Tower Swing. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment confirmation email sent to ${data.email}`);
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error);
    throw new Error('Failed to send payment confirmation email');
  }
}; 