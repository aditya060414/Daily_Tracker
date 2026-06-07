import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Core function to send email by publishing to the RabbitMQ "send-otp" queue.
 */
const sendEmail = async (options: { to: string; subject: string; html: string; text: string }): Promise<void> => {
  try {
    const rabbitHost = process.env.RABBITMQ_HOST || 'localhost';
    const rabbitPort = Number(process.env.RABBITMQ_PORT) || 5672;
    const rabbitUser = process.env.RABBITMQ_USER || 'admin';
    const rabbitPassword = process.env.RABBITMQ_PASSWORD || 'admin123';

    console.log(`[RabbitMQ Publisher] Connecting to amqp://${rabbitUser}@${rabbitHost}:${rabbitPort}...`);
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: rabbitHost,
      port: rabbitPort,
      username: rabbitUser,
      password: rabbitPassword,
    });

    const channel = await connection.createChannel();
    const queueName = "send-otp";

    await channel.assertQueue(queueName, { durable: true });

    // Build payload matching what the consumer parses: { to, subject, body }
    const payload = JSON.stringify({
      to: options.to,
      subject: options.subject,
      body: options.text, // Consumer routes body directly as text to transporter
    });

    channel.sendToQueue(queueName, Buffer.from(payload), { persistent: true });
    console.log(`[RabbitMQ Publisher] OTP request successfully published to queue "${queueName}" for ${options.to}`);

    // Allow a tiny window for socket to flush before closing connections
    await new Promise((resolve) => setTimeout(resolve, 50));
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error(`[RabbitMQ Publisher] Failed to publish to RabbitMQ:`, error);
    
    // Dev sandbox fallback: print to console if RabbitMQ broker is offline or unreachable
    console.log('\n=========================================');
    console.log(`[EMAIL DEVELOPMENT SIMULATION FALLBACK]`);
    console.log(`TO:      ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`TEXT:    ${options.text}`);
    console.log('=========================================\n');
  }
};

/**
 * Sends a registration confirmation email with a 6-digit OTP code.
 */
export const sendSignupOTP = async (email: string, name: string, otp: string): Promise<void> => {
  const subject = 'Verify your DailyOS Account';
  const text = `Hi ${name}, your verification code is ${otp}. It will expire in 5 minutes.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #7c3aed; font-family: monospace;">DAILY_OS SIGN_UP VERIFICATION</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for signing up on DailyOS! To finalize your registration, please input the following 6-digit OTP code:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 30px 0; color: #7c3aed; background-color: #f5f3ff; padding: 15px; border-radius: 6px;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong> and supports a maximum of 3 verification attempts.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html, text });
};

/**
 * Sends a password reset email with a 6-digit OTP code.
 */
export const sendPasswordResetOTP = async (email: string, name: string, otp: string): Promise<void> => {
  const subject = 'Reset your DailyOS Password';
  const text = `Hi ${name}, your password reset verification code is ${otp}. It will expire in 5 minutes.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #7c3aed; font-family: monospace;">DAILY_OS PASSWORD_RESET REQUEST</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your DailyOS password. Please input the following 6-digit OTP code to proceed:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 30px 0; color: #7c3aed; background-color: #f5f3ff; padding: 15px; border-radius: 6px;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong> and supports a maximum of 3 verification attempts.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">If you did not request a password reset, please change your password or contact security immediately.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html, text });
};

/**
 * Sends a welcome confirmation email after successful verification.
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const subject = 'Welcome to your DailyOS Dashboard!';
  const text = `Hi ${name}, your DailyOS account is active and ready to organize your day.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #7c3aed; font-family: monospace;">Welcome to DAILY_OS!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account is officially verified. Your personal life-tracking, gym tracker, meal planner, and focus panels are now fully unlocked.</p>
      <p>Start tracking your routines, completing tasks, and archiving days with reviews.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: monospace;">BOOT_DASHBOARD</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">Host instance: localhost:5173</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html, text });
};
