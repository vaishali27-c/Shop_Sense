import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { authCookieOptions, clearAuthCookieOptions } from '../config/cookies';

function userSecret(): string {
  return process.env.JWT_USER_SECRET ?? process.env.JWT_SECRET ?? 'shopsense-user-secret';
}

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, phone, password } = req.body;
  if (!fullName || !email || !password) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(400).json({ message: 'Email is already registered' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ fullName, email, phone, passwordHash: hash });

  const token = jwt.sign({ id: user._id.toString(), email: user.email }, userSecret(), { expiresIn: '7d' });
  res.cookie('shopsense_user', token, authCookieOptions());

  res.status(201).json({ id: user._id.toString(), fullName: user.fullName, email: user.email });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Missing email or password' });
    return;
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ id: user._id.toString(), email: user.email }, userSecret(), { expiresIn: '7d' });
  res.cookie('shopsense_user', token, authCookieOptions());

  res.json({ id: user._id.toString(), fullName: user.fullName, email: user.email });
}

export async function me(req: Request, res: Response): Promise<void> {
  // req.user is set by middleware when token present
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const found = await UserModel.findById(user.id).select('-passwordHash');
  if (!found) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ id: found._id.toString(), fullName: found.fullName, email: found.email, phone: found.phone });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const { fullName, email, phone } = req.body as { fullName?: unknown; email?: unknown; phone?: unknown };
  if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ message: 'Enter a valid name and email' }); return;
  }
  const duplicate = await UserModel.findOne({ email, _id: { $ne: req.user.id } });
  if (duplicate) { res.status(409).json({ message: 'Email is already registered' }); return; }
  const updated = await UserModel.findByIdAndUpdate(req.user.id, { fullName: fullName.trim(), email: email.trim(), phone: typeof phone === 'string' ? phone.trim() : '' }, { new: true }).select('-passwordHash');
  if (!updated) { res.status(404).json({ message: 'User not found' }); return; }
  const token = jwt.sign({ id: updated._id.toString(), email: updated.email }, userSecret(), { expiresIn: '7d' });
  res.cookie('shopsense_user', token, authCookieOptions());
  res.json({ id: updated._id.toString(), fullName: updated.fullName, email: updated.email, phone: updated.phone });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('shopsense_user', clearAuthCookieOptions());
  res.status(204).send();
}
