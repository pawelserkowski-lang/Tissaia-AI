import { Request, Response, NextFunction } from 'express';

/**
 * Content Security Policy middleware
 * Protects against XSS, clickjacking, and other code injection attacks
 */
export const cspMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  // Set CSP headers
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://cdnjs.cloudflare.com",
      "connect-src 'self' https://generativelanguage.googleapis.com",
      "media-src 'self' data: blob:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );

  next();
};

/**
 * Security headers middleware
 * Adds various security-related HTTP headers
 */
export const securityHeadersMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
    ].join(', ')
  );

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * Rate limiting configuration
 * Prevents brute force attacks
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * File upload validation
 * Validates uploaded files for security
 */
export const validateFileUpload = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' };
  }

  // Check file extension matches MIME type
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
  };

  const expectedExts = mimeToExt[file.mimetype] || [];
  if (ext && !expectedExts.includes(ext)) {
    return { valid: false, error: 'File extension does not match file type' };
  }

  return { valid: true };
};

/**
 * Sanitize filename to prevent path traversal attacks
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
};

/**
 * Validate and sanitize request body
 */
export const sanitizeRequestBody = (body: any): any => {
  if (typeof body === 'string') {
    return body.trim().substring(0, 10000); // Limit string length
  }

  if (typeof body === 'object' && body !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      // Skip proto pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeRequestBody(value);
    }
    return sanitized;
  }

  return body;
};
