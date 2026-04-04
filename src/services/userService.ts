import { AppError, Errors } from '../errors';
import {
  findUserByEmail,
  createUser,
  createProfile,
  updateUserName,
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

  return { token };
};

const editUserName = async (id: number, name: string) => {
  if (!name) throw new AppError(Errors.NAME_REQUIRED);
  return updateUserName(id, name);
};

export { createNewUser, loginUser, editUserName };
