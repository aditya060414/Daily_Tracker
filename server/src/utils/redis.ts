import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      // Reconnect strategy: try every 2 seconds, cap at 10 attempts
      if (retries > 10) {
        console.error('Redis reconnection attempts exhausted.');
        return new Error('Redis connection lost');
      }
      return 2000;
    }
  }
});

client.on('connect', () => {
  console.log('Redis client connecting...');
});

client.on('ready', () => {
  console.log('Redis client connected and ready.');
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Asynchronously connect to the Redis instance
client.connect().catch((err) => {
  console.error('Failed to initialize Redis connection:', err);
});

/**
 * Adds a session token to the user's session Set in Redis.
 * Sets the set TTL to 30 days.
 */
export const setSession = async (userId: string, token: string): Promise<void> => {
  const key = `session:${userId}`;
  await client.sAdd(key, token);
  await client.expire(key, 30 * 24 * 60 * 60); // 30 days TTL
};

/**
 * Checks if a session token is active/valid in the user's session Set.
 */
export const checkSession = async (userId: string, token: string): Promise<boolean> => {
  const key = `session:${userId}`;
  return !!(await client.sIsMember(key, token));
};

/**
 * Removes a single session token (logout from one device).
 */
export const deleteSession = async (userId: string, token: string): Promise<void> => {
  const key = `session:${userId}`;
  await client.sRem(key, token);
};

/**
 * Deletes all session tokens for a user (logout from all devices, e.g., on password reset).
 */
export const deleteAllSessions = async (userId: string): Promise<void> => {
  const key = `session:${userId}`;
  await client.del(key);
};

/**
 * Saves a 6-digit verification OTP in Redis. Expire after 5 minutes.
 */
export const setOTP = async (email: string, otp: string, purpose: string): Promise<void> => {
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  await client.set(key, otp, { EX: 300 }); // 5 minutes TTL
};

/**
 * Fetches the active verification OTP from Redis.
 */
export const getOTP = async (email: string, purpose: string): Promise<string | null> => {
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  return await client.get(key);
};

/**
 * Removes the verification OTP from Redis.
 */
export const deleteOTP = async (email: string, purpose: string): Promise<void> => {
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  await client.del(key);
};

/**
 * Increments the incorrect OTP verification attempts and returns the count.
 * Sets the key to expire in 5 minutes if it is the first attempt.
 */
export const incrementOTPAttempts = async (email: string, purpose: string): Promise<number> => {
  const key = `otp:attempts:${purpose}:${email.toLowerCase()}`;
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, 300); // 5 minutes TTL
  }
  return count;
};

/**
 * Fetches the current attempt count.
 */
export const getOTPAttempts = async (email: string, purpose: string): Promise<number> => {
  const key = `otp:attempts:${purpose}:${email.toLowerCase()}`;
  const val = await client.get(key);
  return val ? parseInt(val, 10) : 0;
};

/**
 * Temporarily stores the pending registration info for a user. Expire after 5 minutes.
 */
export const setPendingUser = async (email: string, userData: any): Promise<void> => {
  const key = `pending_user:${email.toLowerCase()}`;
  await client.set(key, JSON.stringify(userData), { EX: 300 }); // 5 minutes TTL
};

/**
 * Fetches the temporarily stored pending registration details.
 */
export const getPendingUser = async (email: string): Promise<any | null> => {
  const key = `pending_user:${email.toLowerCase()}`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Cleans up the temporarily stored pending registration details.
 */
export const deletePendingUser = async (email: string): Promise<void> => {
  const key = `pending_user:${email.toLowerCase()}`;
  await client.del(key);
};

export default client;
