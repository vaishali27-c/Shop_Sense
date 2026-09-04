import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin';
import { requireJwtSecret } from '../config/jwt';

function userSecret(): string {
  return requireJwtSecret('JWT_USER_SECRET');
}

function adminSecret(): string {
  return requireJwtSecret('JWT_ADMIN_SECRET');
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      admin?: { id: string; email: string };
    }
  }
}

export function verifyUserToken(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.shopsense_user ?? req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const payload = jwt.verify(token, userSecret()) as any;
    if (payload && typeof payload === 'object' && payload.id && payload.email) {
      req.user = { id: String(payload.id), email: String(payload.email) };
    }
  } catch {
    // ignore invalid token
  }

  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (req.user) return next();
  res.status(401).json({ message: 'Unauthorized' });
}

export function verifyAdminToken(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.shopsense_admin ?? req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const payload = jwt.verify(token, adminSecret()) as any;
    if (payload && typeof payload === 'object' && payload.id && payload.email) {
      req.admin = { id: String(payload.id), email: String(payload.email) };
    }
  } catch {
    // ignore invalid token
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.admin) return next();
  res.status(403).json({ message: 'Forbidden' });
}

export async function createAdminIfMissing(): Promise<{ created: boolean; skipped: boolean } | undefined> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return undefined;

  const existing = await AdminModel.findOne({ email: adminEmail });
  const hash = await bcrypt.hash(adminPassword, 10);

  if (existing) {
    await AdminModel.updateOne({ _id: existing._id }, { email: adminEmail, passwordHash: hash });
    return { created: false, skipped: true };
  }

  const configuredAdmin = await AdminModel.findOne().sort({ createdAt: 1 });
  if (configuredAdmin) {
    await AdminModel.updateOne(
      { _id: configuredAdmin._id },
      { email: adminEmail, passwordHash: hash },
    );
    return { created: false, skipped: true };
  }

  await AdminModel.create({ email: adminEmail, passwordHash: hash, name: 'Admin' });
  console.log('[ShopSense API] Admin account created');
  return { created: true, skipped: false };
}

export function logAdminReady() {
  console.log('[ShopSense API] Admin account ready');
}
