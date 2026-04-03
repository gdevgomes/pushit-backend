import { generateCode } from '../../src/utils/generateGroupCode';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

describe('generateCode', () => {
  it('retorna uma string de exatamente 6 caracteres', () => {
    expect(generateCode(1)).toHaveLength(6);
    expect(generateCode(100)).toHaveLength(6);
    expect(generateCode(9999)).toHaveLength(6);
  });

  it('IDs diferentes geram códigos diferentes', () => {
    const codes = [1, 2, 3, 50, 100].map(generateCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('é determinístico — mesmo ID gera mesmo código', () => {
    expect(generateCode(42)).toBe(generateCode(42));
    expect(generateCode(1)).toBe(generateCode(1));
  });

  it('usa apenas caracteres base62', () => {
    for (let id = 1; id <= 50; id++) {
      const code = generateCode(id);
      for (const char of code) {
        expect(BASE62).toContain(char);
      }
    }
  });
});
