import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { checkSession } from '../utils/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
  token?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Access denied. No token provided.',
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid or expired token.',
      });
    }

    // Verify session in Redis
    const isSessionActive = await checkSession(decoded.userId, token);
    if (!isSessionActive) {
      if (cookieToken) {
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Session expired or invalidated. Please login again.',
      });
    }

    // Session Recovery: if cookie is missing but valid token is in Authorization header, re-issue cookie
    if (!cookieToken && headerToken) {
      res.cookie('token', headerToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};
