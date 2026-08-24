import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminModel } from '../models/Admin';
import { authCookieOptions, clearAuthCookieOptions } from '../config/cookies';

function adminSecret(): string {
  return process.env.JWT_ADMIN_SECRET ?? process.env.JWT_SECRET ?? 'shopsense-admin-secret';
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Missing email or password' });
    return;
  }

  // basic validation
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Invalid email' });
    return;
  }

  const admin = await AdminModel.findOne({ email });
  if (!admin) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const token = jwt.sign({ id: admin._id.toString(), email: admin.email }, adminSecret(), { expiresIn: '7d' });
  res.cookie('shopsense_admin', token, authCookieOptions());

  res.json({ id: admin._id.toString(), email: admin.email, name: admin.name });
}

export async function adminMe(req: Request, res: Response): Promise<void> {
  const adminReq = req.admin;
  if (!adminReq) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const found = await AdminModel.findById(adminReq.id).select('-passwordHash');
  if (!found) {
    res.status(404).json({ message: 'Admin not found' });
    return;
  }

  res.json({ id: found._id.toString(), email: found.email, name: found.name });
}

export async function adminLogout(req: Request, res: Response): Promise<void> {
  res.clearCookie('shopsense_admin', clearAuthCookieOptions());
  res.status(204).send();
}
