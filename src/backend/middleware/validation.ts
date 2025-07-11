import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ApiResponse } from '../types/common';

// Validate MongoDB ObjectId
export const validateObjectId = (req: Request, res: Response, next: NextFunction): void => {
  const { id, tournamentId, playerId } = req.params;
  
  const idsToValidate = [
    { name: 'id', value: id },
    { name: 'tournamentId', value: tournamentId },
    { name: 'playerId', value: playerId },
  ].filter(item => item.value);

  for (const { name, value } of idsToValidate) {
    if (value && !Types.ObjectId.isValid(value)) {
      const response: ApiResponse = {
        success: false,
        error: `Invalid ${name} format`,
      };
      res.status(400).json(response);
      return;
    }
  }

  next();
};

// Validate required fields
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];
    
    fields.forEach(field => {
      const value = req.body[field];
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '')) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
};

// Validate email format
export const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email format',
      };
      res.status(400).json(response);
      return;
    }
  }

  next();
};

// Validate date format
export const validateDate = (field: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dateValue = req.body[field];
    
    if (dateValue) {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        const response: ApiResponse = {
          success: false,
          error: `Invalid date format for ${field}`,
        };
        res.status(400).json(response);
        return;
      }
    }

    next();
  };
};

// Validate numeric range
export const validateRange = (field: string, min?: number, max?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    
    if (value !== undefined && value !== null) {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        const response: ApiResponse = {
          success: false,
          error: `${field} must be a number`,
        };
        res.status(400).json(response);
        return;
      }

      if (min !== undefined && numValue < min) {
        const response: ApiResponse = {
          success: false,
          error: `${field} must be at least ${min}`,
        };
        res.status(400).json(response);
        return;
      }

      if (max !== undefined && numValue > max) {
        const response: ApiResponse = {
          success: false,
          error: `${field} must be at most ${max}`,
        };
        res.status(400).json(response);
        return;
      }
    }

    next();
  };
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit } = req.query;
  
  if (page) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      const response: ApiResponse = {
        success: false,
        error: 'Page must be a positive integer',
      };
      res.status(400).json(response);
      return;
    }
  }

  if (limit) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      const response: ApiResponse = {
        success: false,
        error: 'Limit must be between 1 and 100',
      };
      res.status(400).json(response);
      return;
    }
  }

  next();
};

// Sanitize input
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Remove potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (!dangerousFields.includes(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }

    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  next();
};