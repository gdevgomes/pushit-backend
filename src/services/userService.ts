import { AppError } from '../middlewares/errorHandler';
import {
  findUserByEmail,
  createUser,
  updateUserName,
} from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import { NewUser } from '../types/user';
import jwt from 'jsonwebtoken';

const findUser = async (user: NewUser) => {
  return await findUserByEmail({
    email: user.email,
  });
};

async function hashPassword(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

const createNewUser = async (userData: any) => {
  const hasUser = await findUser(userData);
  if (hasUser) {
    throw new AppError('User Exists', 409);
  }
  if (!userData.password || !userData.confirmPassword) {
    throw new AppError('Password and Confirm Password Required', 400);
  }
  if (userData.password !== userData.confirmPassword) {
    throw new AppError("Password don't match", 400);
  }

  const { password, confirmPassword, ...user } = userData;

  const newUser = await createUser({
    ...user,
    timezone: userData.timezone ?? 'UTC',
    passwordHash: await hashPassword(userData.password),
  });

  return newUser;
};

const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail({ email });
  if (!user) throw new AppError('User not found', 404);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid password', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '1d' }
  );

  return { token };
};

const editUserName = async (id: number, name: string) => {
  if (!name) throw new AppError('Name is required', 400);
  const updated = await updateUserName(id, name);
  return updated;
};

export { createNewUser, loginUser, editUserName };
