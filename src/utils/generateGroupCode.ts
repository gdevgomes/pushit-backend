const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const encodeBase62 = (num: number) => {
  let str = '';
  num += 1000;
  while (num > 0) {
    str = chars[num % 62] + str;
    num = Math.floor(num / 62);
  }

  return str || '0';
};

const generateCode = (id: number) => {
  const encoded = encodeBase62(id);
  return encoded.padStart(6, '0').toUpperCase();
};

export { generateCode };
