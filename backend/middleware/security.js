const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { auditService } = require('../services/database');

// JWT Secret management
class JWTSecretManager {
  constructor() {
    this.currentSecret = process.env.JWT_SECRET;
    this.previousSecret = process.env.JWT_PREVIOUS_SECRET;
    this.secretRotationInterval = process.env.JWT_SECRET_ROTATION_DAYS || 30; // days
    this.lastRotation = process.env.JWT_SECRET_LAST_ROTATION || new Date().toISOString();
  }

  // Generate a new JWT secret
  static generateSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Check if secret rotation is needed
  shouldRotateSecret() {
    const lastRotationDate = new Date(this.lastRotation);
    const daysSinceRotation = (Date.now() - lastRotationDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= this.secretRotationInterval;
  }

  // Rotate JWT secret (this would typically be done through a scheduled job)
  async rotateSecret() {
    const newSecret = JWTSecretManager.generateSecret();
    
    // Log secret rotation
    await auditService.log({
      userId: null,
      action: 'JWT_SECRET_ROTATED',
      resourceType: 'SECURITY',
      resourceId: 'jwt_secret',
      oldValues: { rotationDate: this.lastRotation },
      newValues: { rotationDate: new Date().toISOString() },
      ipAddress: 'system',
      userAgent: 'system'
    });

    console.warn('⚠️  JWT Secret rotation needed!');
    console.warn('📋 New secret generated. Please update environment variables:');
    console.warn(`   JWT_PREVIOUS_SECRET=${this.currentSecret}`);
    console.warn(`   JWT_SECRET=${newSecret}`);
    console.warn(`   JWT_SECRET_LAST_ROTATION=${new Date().toISOString()}`);
    
    return {
      newSecret,
      previousSecret: this.currentSecret,
      rotationDate: new Date().toISOString()
    };
  }

  // Verify token with fallback to previous secret
  verifyToken(token, options = {}) {
    try {
      // Try with current secret first
      return jwt.verify(token, this.currentSecret, options);
    } catch (error) {
      if (this.previousSecret) {
        try {
          // Fallback to previous secret for graceful rotation
          const decoded = jwt.verify(token, this.previousSecret, options);
          
          // Log usage of old secret (for monitoring)
          console.warn('⚠️  Token verified with previous JWT secret. Consider forcing user re-login.');
          
          return decoded;
        } catch (fallbackError) {
          throw error; // Throw original error
        }
      }
      throw error;
    }
  }
}

// Impersonation token management
class ImpersonationTokenManager {
  static generateImpersonationToken(user, impersonationData) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      type: 'impersonation',
      impersonator_id: impersonationData.impersonator_id,
      impersonated_user_id: impersonationData.impersonated_user_id,
      session_id: impersonationData.session_id,
      is_impersonation: true,
      iat: Math.floor(Date.now() / 1000)
    };

    // Impersonation tokens have shorter lifetime (1 hour)
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
      issuer: 'framtt-superadmin',
      audience: 'framtt-users'
    });
  }

  static async validateImpersonationToken(token) {
    try {
      const secretManager = new JWTSecretManager();
      const decoded = secretManager.verifyToken(token, {
        issuer: 'framtt-superadmin',
        audience: 'framtt-users'
      });

      // Verify it's an impersonation token
      if (decoded.type !== 'impersonation' || !decoded.is_impersonation) {
        throw new Error('Invalid impersonation token type');
      }

      // Check required impersonation claims
      if (!decoded.impersonator_id || !decoded.impersonated_user_id || !decoded.session_id) {
        throw new Error('Missing required impersonation claims');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Invalid impersonation token: ${error.message}`);
    }
  }
}

// Token blacklist for logout/revocation
class TokenBlacklist {
  constructor() {
    // In a real implementation, this would use Redis or database
    this.blacklistedTokens = new Map();
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour
    
    // Start cleanup job
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  // Add token to blacklist
  async addToken(tokenId, expiresAt) {
    this.blacklistedTokens.set(tokenId, expiresAt);
    
    // Log token blacklisting
    await auditService.log({
      userId: null,
      action: 'TOKEN_BLACKLISTED',
      resourceType: 'SECURITY',
      resourceId: tokenId,
      oldValues: null,
      newValues: { expiresAt },
      ipAddress: 'system',
      userAgent: 'system'
    });
  }

  // Check if token is blacklisted
  isBlacklisted(tokenId) {
    return this.blacklistedTokens.has(tokenId);
  }

  // Remove expired tokens from blacklist
  cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [tokenId, expiresAt] of this.blacklistedTokens.entries()) {
      if (expiresAt < now) {
        this.blacklistedTokens.delete(tokenId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired blacklisted tokens`);
    }
  }
}

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// Input validation and sanitization
const sanitizeInput = (req, res, next) => {
  // Remove null bytes and control characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/[\x00-\x1F\x7F]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Global security instances
const jwtSecretManager = new JWTSecretManager();
const tokenBlacklist = new TokenBlacklist();

module.exports = {
  JWTSecretManager,
  ImpersonationTokenManager,
  TokenBlacklist,
  securityHeaders,
  sanitizeInput,
  jwtSecretManager,
  tokenBlacklist
};
