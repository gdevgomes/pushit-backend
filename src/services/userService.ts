import { AppError, Errors } from '../errors';
import {
  findUserByEmail,
  findUserById,
  createUser,
  createProfile,
  updateProfile,
} from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

const createNewUser = async (userData: any) => {
  const existing = await findUserByEmail({ email: userData.email });
  if (existing) throw new AppError(Errors.USER_EXISTS);

  if (!userData.password || !userData.confirmPassword)
    throw new AppError(Errors.PASSWORD_REQUIRED);
  if (userData.password !== userData.confirmPassword)
    throw new AppError(Errors.PASSWORD_MISMATCH);

  const user = await createUser({
    email: userData.email,
    passwordHash: await hashPassword(userData.password),
  });

  await createProfile({
    user_id: user.id,
    name: userData.name,
    timezone: userData.timezone ?? 'UTC',
  });

  return { id: user.id, name: userData.name, email: user.email, timezone: userData.timezone ?? 'UTC' };
};

const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail({ email });
  if (!user) throw new AppError(Errors.USER_NOT_FOUND);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(Errors.INVALID_PASSWORD);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
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
};

const editProfile = async (id: number, data: EditProfileData) => {
  const profileFields: Partial<{ name: string; timezone: string }> = {};
  const userFields: Partial<{ email: string; passwordHash: string }> = {};

  if (data.name) profileFields.name = data.name;
  if (data.timezone) profileFields.timezone = data.timezone;

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

export { createNewUser, loginUser, editProfile };
