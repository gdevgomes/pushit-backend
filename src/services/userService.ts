import { AppError, Errors } from '../errors';
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  createProfile,
  updateProfile,
} from '../repositories/userRepository';
import providerRepository from '../repositories/providerRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { RegisterInput } from '../types/user';

async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
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
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(Errors.INVALID_PASSWORD);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    },
  };
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
    const fullUser = await findUserByEmail({ email: user.email });
    if (!fullUser) throw new AppError(Errors.USER_NOT_FOUND);
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

  if (existing) {
    const user = await findUserById(existing.user_id);
    if (!user) throw new AppError(Errors.USER_NOT_FOUND);
    userId = user.id;
    userEmail = user.email;
    userName = user.name;
    userTimezone = user.timezone;
  } else {
    const byEmail = await findUserByEmail({ email: data.email });

    if (byEmail) {
      userId = byEmail.id;
      userEmail = byEmail.email;
      userName = byEmail.name;
      userTimezone = byEmail.timezone;
    } else {
      const unusableHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const baseUsername = data.email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const existingUn = await findUserByUsername(baseUsername);
      const username = existingUn ? `${baseUsername}_${Date.now()}` : baseUsername;
      const user = await createUser({ username, email: data.email, passwordHash: unusableHash });
      await createProfile({ user_id: user.id, name: data.name, timezone: data.timezone ?? 'UTC' });
      userId = user.id;
      userEmail = user.email;
      userName = data.name;
      userTimezone = data.timezone ?? 'UTC';
    }

    await providerRepository.create({ user_id: userId, provider: data.provider, provider_id: data.provider_id, email: data.email ?? null });
  }

  const token = jwt.sign(
    { id: userId, email: userEmail },
    env.jwtSecret,
    { expiresIn: '1d' }
  );

  return { token, user: { id: userId, email: userEmail, name: userName, timezone: userTimezone } };
};

export { createNewUser, loginUser, editProfile, loginWithProvider };
