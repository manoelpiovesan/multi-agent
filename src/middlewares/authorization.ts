import express from "express";
import jwt from "jsonwebtoken";
import {UserRole} from "../models/api/user";
import {APIUser} from "../types/api/user_types";

/**
 * Authenticate JWT token and return the decoded user information.
 * @param token JWT token string
 * @returns Decoded user information
 * @throws Error object with message property if verification fails
 */
export function authenticateJwtToken(token: string): APIUser {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as APIUser;
  } catch {
    throw {message: 'Invalid token'};
  }
}

/**
 * Authentication middleware for Express applications.
 * @param request Express request object
 * @param securityName Name of the security scheme (e.g., 'jwt')
 * @param scopes Optional array of required roles for access control
 * @returns Promise that resolves if authentication is successful,
 * or rejects with an error message if authentication fails
 */
export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
): Promise<any> {

  if (securityName !== 'jwt' && securityName !== 'google-jwt') {
    return Promise.reject({ message: 'Unsupported security scheme' });
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Promise.reject({ message: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Verify token and attach user info to request
    request.jwt_user = authenticateJwtToken(token);

    // Role checking
    if (scopes && scopes.length > 0) {
      const userRole = request.jwt_user!.role || UserRole.USER;
      if (!scopes.includes(userRole)) {
        return Promise.reject({ message: 'Insufficient role' });
      }
    }

    return Promise.resolve();
  } catch {
    return Promise.reject({ message: 'Invalid token' });
  }

}

/**
 * Express middleware wrapper for authentication
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns void
 */
export const authMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  expressAuthentication(req, 'jwt')
    .then(() => next())
    .catch((err) => {
      res.status(401).json({ error: err.message || 'Unauthorized' });
    });
};
