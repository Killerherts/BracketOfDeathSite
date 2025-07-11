import { Response, NextFunction } from 'express';
import { RequestWithAuth } from '../controllers/base';
import { ApiResponse } from '../types/common';

// Mock authentication for development - replace with Google OAuth in production
export const verifyGoogleToken = async (token: string) => {
  // TODO: Implement actual Google token verification
  if (token === 'mock-admin-token') {
    return {
      email: 'admin@example.com',
      googleId: 'mock-admin-id',
      name: 'Admin User',
      picture: '',
    };
  }
  throw new Error('Invalid token');
};

// Check if user is authorized
export const isAuthorizedUser = (email: string): boolean => {
  const authorizedUsers = process.env.AUTHORIZED_USERS?.split(',') || ['admin@example.com'];
  return authorizedUsers.map(u => u.trim().toLowerCase()).includes(email.toLowerCase());
};

// Authentication middleware
export const requireAuth = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Authorization token required',
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Authorization token required',
      };
      res.status(401).json(response);
      return;
    }

    // Verify the token
    const userInfo = await verifyGoogleToken(token);
    
    // Check if user is authorized
    const isAuthorized = isAuthorizedUser(userInfo.email);
    
    if (!isAuthorized) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. User not authorized.',
      };
      res.status(403).json(response);
      return;
    }

    // Add user info to request
    req.user = {
      email: userInfo.email,
      googleId: userInfo.googleId,
      isAuthorized: true,
    };

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
    };
    res.status(401).json(response);
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: RequestWithAuth,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const userInfo = await verifyGoogleToken(token);
          const isAuthorized = isAuthorizedUser(userInfo.email);
          
          req.user = {
            email: userInfo.email,
            googleId: userInfo.googleId,
            isAuthorized,
          };
        } catch (error) {
          // Invalid token, but don't fail the request
          req.user = undefined;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail the request for optional auth
    next();
  }
};

// Admin-only middleware
export const requireAdmin = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First check authentication
  await requireAuth(req, res, () => {
    // Add additional admin checks here if needed
    // For now, all authorized users are considered admins
    if (req.user && req.user.isAuthorized) {
      next();
    } else {
      const response: ApiResponse = {
        success: false,
        error: 'Admin access required',
      };
      res.status(403).json(response);
    }
  });
};