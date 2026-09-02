import type { Request, Response } from 'express';
import { AddressModel } from '../models/Address';

function ownerId(req: Request): string | null {
  return req.user?.id ?? null;
}

function validAddress(payload: Record<string, unknown>): boolean {
  return ['label', 'street', 'city', 'state', 'pincode'].every(
    (key) => typeof payload[key] === 'string' && Boolean(String(payload[key]).trim()),
  ) && /^\d{6}$/.test(String(payload.pincode));
}

async function makeDefault(userId: string, addressId: string): Promise<void> {
  await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
  await AddressModel.updateOne({ _id: addressId, userId }, { $set: { isDefault: true } });
}

export async function getAddresses(req: Request, res: Response): Promise<void> {
  const userId = ownerId(req);
  if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
  res.json(await AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }));
}

export async function createAddress(req: Request, res: Response): Promise<void> {
  const userId = ownerId(req);
  if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
  if (!validAddress(req.body)) { res.status(400).json({ message: 'Enter a complete address and valid pincode' }); return; }
  const first = !(await AddressModel.exists({ userId }));
  const address = await AddressModel.create({ ...req.body, userId, isDefault: first || Boolean(req.body.isDefault) });
  if (address.isDefault) await makeDefault(userId, address.id);
  res.status(201).json(address);
}

export async function updateAddress(req: Request, res: Response): Promise<void> {
  const userId = ownerId(req);
  if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
  if (!validAddress(req.body)) { res.status(400).json({ message: 'Enter a complete address and valid pincode' }); return; }
  const address = await AddressModel.findOneAndUpdate({ _id: req.params.id, userId }, { ...req.body, userId }, { new: true, runValidators: true });
  if (!address) { res.status(404).json({ message: 'Address not found' }); return; }
  if (address.isDefault) await makeDefault(userId, address.id);
  res.json(address);
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
  const userId = ownerId(req);
  if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
  const address = await AddressModel.findOneAndDelete({ _id: req.params.id, userId });
  if (!address) { res.status(404).json({ message: 'Address not found' }); return; }
  if (address.isDefault) {
    const replacement = await AddressModel.findOne({ userId }).sort({ createdAt: 1 });
    if (replacement) await makeDefault(userId, replacement.id);
  }
  res.status(204).send();
}

export async function setDefaultAddress(req: Request, res: Response): Promise<void> {
  const userId = ownerId(req);
  if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
  const address = await AddressModel.findOne({ _id: req.params.id, userId });
  if (!address) { res.status(404).json({ message: 'Address not found' }); return; }
  await makeDefault(userId, address.id);
  res.json(await AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }));
}