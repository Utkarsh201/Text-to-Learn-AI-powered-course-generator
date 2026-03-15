const emailQueue = require('./emailQueue');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure the Nodemailer transporter (SMTP configuration)
// It is recommended to use an SMTP service provider (SendGrid, Mailgun) or Ethereal for testing
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Worker to process the email sending jobs in the background
emailQueue.process(async (job) => {
  const { email, name } = job.data;
  
  try {
    const info = await transporter.sendMail({
      from: '"Welcome Team" <noreply@yourdomain.com>',
      to: email, // Receiver address from the job payload
      subject: "Welcome to Our Platform!", // Target Subject
      text: `Hello ${name}, welcome aboard! We are excited to have you.`, // Plain text
      html: `<b>Hello ${name}</b>,<br>Welcome aboard! We are excited to have you.`, // HTML template
    });
    
    console.log('Welcome email successfully sent to', email, 'Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Throwing error allows Bull queue to handle retry logic
    throw error;
  }
});

// Event listener for completed active jobs
emailQueue.on('completed', (job, result) => {
  console.log(`Job with id ${job.id} has been completed`);
});
