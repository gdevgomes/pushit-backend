import { AppError, Errors } from '../errors';
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  findUserByDeviceId,
  createUser,
  createProfile,
  createDeviceUser,
  elevateToLocal,
  elevateToProvider,
  updateProfile,
} from '../repositories/userRepository';
import providerRepository from '../repositories/providerRepository';
import groupRepository from '../repositories/groupRepository';
import subscriptionRepository from '../repositories/subscriptionRepository';
import planRepository from '../repositories/planRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AccountType, RegisterInput } from '../types/user';
import { AuthUser } from '../types/express';

async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

function generateToken(id: number, email: string | null, accountType: AccountType) {
  return jwt.sign({ id, email, accountType }, env.jwtSecret, { expiresIn: '1d' });
}

async function createDefaultGroup(userId: number, userName: string, user: AuthUser) {
  const sandBoxPlan = await planRepository.getBySlug('sand-box');
  if (!sandBoxPlan) return;
  const group = await groupRepository.createGroup({ name: `${userName}'s Group`, description: null, owner_id: userId });
  await groupRepository.addUserToGroup(userId, group.id);
  await subscriptionRepository.create(group.id, new Date(), sandBoxPlan.id, 0, 'active');
}

const createNewUser = async (userData: RegisterInput) => {
  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail({ email: userData.email }),
    findUserByUsername(userData.username),
  ]);
  if (existingEmail || existingUsername) throw new AppError(Errors.USER_EXISTS);

  if (!userData.password || !userData.confirmPassword)
    throw new AppError(Errors.PASSWORD_REQUIRED);
  if (userData.password !== userData.confirmPassword)
    throw new AppError(Errors.PASSWORD_MISMATCH);

  const user = await createUser({
    username: userData.username,
    email: userData.email,
    passwordHash: await hashPassword(userData.password),
    account_type: 'local',
  });

  await createProfile({
    user_id: user.id,
    name: userData.name,
    timezone: userData.timezone ?? 'UTC',
  });

  return { id: user.id, username: user.username, name: userData.name, email: user.email, timezone: userData.timezone ?? 'UTC' };
};

const loginUser = async (username: string, password: string) => {
  const user = username.includes('@')
    ? await findUserByEmail({ email: username })
    : await findUserByUsername(username);
  if (!user) throw new AppError(Errors.USER_NOT_FOUND);
  if (!user.passwordHash) throw new AppError(Errors.INVALID_PASSWORD);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(Errors.INVALID_PASSWORD);

  const token = generateToken(user.id, user.email, user.account_type ?? 'local');

  return {
    token,
    user: {
      id: user.id,
      account_type: user.account_type,
      username: user.username,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    },
  };
};

const loginOrCreateDevice = async (device_id: string) => {
  let user = await findUserByDeviceId(device_id);

  if (!user) {
    const created = await createDeviceUser(device_id);
    await createProfile({ user_id: created.id, name: 'Usuário', timezone: 'UTC' });
    user = await findUserByDeviceId(device_id);
  }

  if (!user) throw new AppError(Errors.USER_NOT_FOUND);

  const token = generateToken(user.id, null, 'device');

  return {
    token,
    user: {
      id: user.id,
      account_type: 'device' as const,
      username: null,
      email: null,
      name: user.name ?? 'Usuário',
      timezone: user.timezone ?? 'UTC',
    },
  };
};

type ElevateLocalData = {
  name: string;
  username: string;
  email: string;
  password: string;
  timezone?: string;
};

const elevateAccountToLocal = async (userId: number, data: ElevateLocalData) => {
  const currentUser = await findUserById(userId);
  if (!currentUser) throw new AppError(Errors.USER_NOT_FOUND);
  if (currentUser.account_type !== 'device') throw new AppError(Errors.ACCOUNT_ALREADY_ELEVATED);

  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail({ email: data.email }),
    findUserByUsername(data.username),
  ]);
  if (existingEmail || existingUsername) throw new AppError(Errors.USER_EXISTS);

  const passwordHash = await hashPassword(data.password);
  await elevateToLocal(userId, { email: data.email, username: data.username, passwordHash });
  await updateProfile(userId, { name: data.name, timezone: data.timezone ?? 'UTC' }, {});

  const token = generateToken(userId, data.email, 'local');

  const fakeAuthUser: AuthUser = { id: userId, email: data.email, accountType: 'local', iat: 0, exp: 0 };
  await createDefaultGroup(userId, data.name, fakeAuthUser);

  return {
    token,
    user: {
      id: userId,
      account_type: 'local' as const,
      username: data.username,
      email: data.email,
      name: data.name,
      timezone: data.timezone ?? 'UTC',
    },
  };
};

type ElevateProviderData = {
  provider_id: string;
  provider: string;
  email: string;
  name: string;
  timezone?: string;
};

const elevateAccountToProvider = async (userId: number, data: ElevateProviderData) => {
  const currentUser = await findUserById(userId);
  if (!currentUser) throw new AppError(Errors.USER_NOT_FOUND);
  if (currentUser.account_type !== 'device') throw new AppError(Errors.ACCOUNT_ALREADY_ELEVATED);

  const existingEmail = await findUserByEmail({ email: data.email });
  if (existingEmail && existingEmail.id !== userId) throw new AppError(Errors.USER_EXISTS);

  const baseUsername = data.email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const existingUn = await findUserByUsername(baseUsername);
  const username = existingUn ? `${baseUsername}_${Date.now()}` : baseUsername;

  await elevateToProvider(userId, { email: data.email, username });
  await providerRepository.create({ user_id: userId, provider: data.provider, provider_id: data.provider_id, email: data.email });
  await updateProfile(userId, { name: data.name, timezone: data.timezone ?? 'UTC' }, {});

  const token = generateToken(userId, data.email, 'provider');

  const fakeAuthUser: AuthUser = { id: userId, email: data.email, accountType: 'provider', iat: 0, exp: 0 };
  await createDefaultGroup(userId, data.name, fakeAuthUser);

  return {
    token,
    user: {
      id: userId,
      account_type: 'provider' as const,
      username,
      email: data.email,
      name: data.name,
      timezone: data.timezone ?? 'UTC',
    },
  };
};

type AddProviderData = {
  provider_id: string;
  provider: string;
  email: string;
  name: string;
};

const addProviderToAccount = async (userId: number, data: AddProviderData) => {
  const existing = await providerRepository.findByProvider(data.provider, data.provider_id);
  if (existing && existing.user_id !== userId) throw new AppError(Errors.USER_EXISTS);
  if (existing && existing.user_id === userId) return;

  await providerRepository.create({ user_id: userId, provider: data.provider, provider_id: data.provider_id, email: data.email });
};

type EditProfileData = {
  name?: string;
  timezone?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
  push_token?: string;
};

const editProfile = async (id: number, data: EditProfileData) => {
  const profileFields: Partial<{ name: string; timezone: string; push_token: string }> = {};
  const userFields: Partial<{ email: string; passwordHash: string }> = {};

  if (data.name) profileFields.name = data.name;
  if (data.timezone) profileFields.timezone = data.timezone;
  if (data.push_token !== undefined) profileFields.push_token = data.push_token;

  if (data.email) {
    const existing = await findUserByEmail({ email: data.email });
    if (existing && existing.id !== id) throw new AppError(Errors.USER_EXISTS);
    userFields.email = data.email;
  }

  if (data.password) {
    const user = await findUserById(id);
    if (!user) throw new AppError(Errors.USER_NOT_FOUND);
    const fullUser = await findUserByEmail({ email: user.email! });
    if (!fullUser) throw new AppError(Errors.USER_NOT_FOUND);
    if (!fullUser.passwordHash) throw new AppError(Errors.INVALID_PASSWORD);
    const valid = await bcrypt.compare(data.currentPassword!, fullUser.passwordHash);
    if (!valid) throw new AppError(Errors.INVALID_PASSWORD);
    userFields.passwordHash = await hashPassword(data.password);
  }

  return updateProfile(id, profileFields, userFields);
};

type ProviderLoginData = {
  provider: string;
  provider_id: string;
  email: string;
  name: string;
  timezone?: string;
};

const loginWithProvider = async (data: ProviderLoginData) => {
  const existing = await providerRepository.findByProvider(data.provider, data.provider_id);

  let userId: number;
  let userEmail: string;
  let userName: string;
  let userTimezone: string;
  let accountType: AccountType;

  if (existing) {
    const user = await findUserById(existing.user_id);
    if (!user) throw new AppError(Errors.USER_NOT_FOUND);
    userId = user.id;
    userEmail = user.email!;
    userName = user.name;
    userTimezone = user.timezone;
    accountType = user.account_type;
  } else {
    const byEmail = await findUserByEmail({ email: data.email });

    if (byEmail) {
      userId = byEmail.id;
      userEmail = byEmail.email!;
      userName = byEmail.name;
      userTimezone = byEmail.timezone;
      accountType = byEmail.account_type;
      await providerRepository.create({ user_id: userId, provider: data.provider, provider_id: data.provider_id, email: data.email ?? null });
    } else {
      const unusableHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const baseUsername = data.email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const existingUn = await findUserByUsername(baseUsername);
      const username = existingUn ? `${baseUsername}_${Date.now()}` : baseUsername;
      const user = await createUser({ username, email: data.email, passwordHash: unusableHash, account_type: 'provider' });
      await createProfile({ user_id: user.id, name: data.name, timezone: data.timezone ?? 'UTC' });
      await providerRepository.create({ user_id: user.id, provider: data.provider, provider_id: data.provider_id, email: data.email ?? null });
      userId = user.id;
      userEmail = data.email;
      userName = data.name;
      userTimezone = data.timezone ?? 'UTC';
      accountType = 'provider';

      const fakeAuthUser: AuthUser = { id: userId, email: userEmail, accountType: 'provider', iat: 0, exp: 0 };
      await createDefaultGroup(userId, userName, fakeAuthUser);
    }
  }

  const token = generateToken(userId, userEmail, accountType);

  return { token, user: { id: userId, account_type: accountType, email: userEmail, name: userName, timezone: userTimezone } };
};

export { createNewUser, loginUser, loginOrCreateDevice, elevateAccountToLocal, elevateAccountToProvider, addProviderToAccount, editProfile, loginWithProvider };
