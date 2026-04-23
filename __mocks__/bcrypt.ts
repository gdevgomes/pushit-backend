const FAKE_HASH_PREFIX = '__fakehash__:';

export const hash = async (password: string): Promise<string> =>
  `${FAKE_HASH_PREFIX}${password}`;

export const compare = async (password: string, hashed: string): Promise<boolean> =>
  hashed === `${FAKE_HASH_PREFIX}${password}`;

export const hashSync = (password: string): string =>
  `${FAKE_HASH_PREFIX}${password}`;

export const compareSync = (password: string, hashed: string): boolean =>
  hashed === `${FAKE_HASH_PREFIX}${password}`;

export const genSalt = async (rounds?: number): Promise<string> => `fakesalt_${rounds ?? 10}`;
export const genSaltSync = (rounds?: number): string => `fakesalt_${rounds ?? 10}`;
export const getRounds = (): number => 1;

export default { hash, compare, hashSync, compareSync, genSalt, genSaltSync, getRounds };
