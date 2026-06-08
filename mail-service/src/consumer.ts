import amqp from 'amqplib';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT) || 5672;

export const startConnection = async () => {
  try {
    const rabbitHost = process.env.RABBITMQ_HOST || 'localhost';
    const rabbitUser = process.env.RABBITMQ_USER || 'admin';
    const rabbitPassword = process.env.RABBITMQ_PASSWORD || 'admin123';

    console.log(`[Mail Service] Connecting to RabbitMQ amqp://${rabbitUser}@${rabbitHost}:${RABBITMQ_PORT}...`);
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: rabbitHost,
      port: RABBITMQ_PORT,
      username: rabbitUser,
      password: rabbitPassword,
    });

    const channel = await connection.createChannel();
    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });

    console.log(`[Mail Service] Connected and listening on queue "${queueName}"`);

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = msg.content.toString();
          let payload;
          try {
            payload = JSON.parse(content);
          } catch (e) {
            console.error(`[Mail Service] Failed to parse message JSON:`, content);
            channel.ack(msg);
            return;
          }

          const { to, subject, body } = payload;
          if (!to) {
            console.error(`[Mail Service] Missing recipient ("to") in payload:`, payload);
            channel.ack(msg);
            return;
          }

          console.log(`[Mail Service] Received OTP delivery request for: ${to}`);

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });

          await transporter.sendMail({
            from: `"myFIT" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: body,
          });

          console.log(`[Mail Service] OTP successfully sent to: ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.error(`[Mail Service] Failed to process OTP message:`, error);
          // Acknowledge the message to prevent it from looping infinitely
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error("[Mail Service] Failed to connect to RabbitMQ broker:", error);
  }
};
