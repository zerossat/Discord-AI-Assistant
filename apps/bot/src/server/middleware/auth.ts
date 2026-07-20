import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AuthedRequest extends Request {
  user?: jwt.JwtPayload;
}

/**
 * Verify a `Authorization: Bearer <jwt>` header signed (HS256) with the shared
 * `JWT_SECRET`. The dashboard mints these tokens server-side using the same
 * secret, so no extra auth handshake is required between the two apps.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = typeof payload === 'string' ? { sub: payload } : payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
