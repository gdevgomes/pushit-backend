import { describe, it, expect } from 'vitest';
import { computeScheduledAt } from '../../src/utils/computeScheduledAt';

describe('computeScheduledAt', () => {
  const TZ = 'America/Sao_Paulo';

  it('retorna próximo ano quando data já passou em 2025', () => {
    // 1º de janeiro sempre já passou (ou está passando), então deve retornar ano seguinte
    const result = computeScheduledAt(1, 1, TZ);
    const now = new Date();
    expect(result.getFullYear()).toBeGreaterThanOrEqual(now.getFullYear());
    // Se mês 1, dia 1 já passou este ano, deve ser ano que vem
    const thisYear = new Date(now.getFullYear(), 0, 1, 9, 0, 0); // 1/jan às 6h SP = 9h UTC
    if (thisYear <= now) {
      expect(result.getFullYear()).toBe(now.getFullYear() + 1);
    }
  });

  it('retorna este ano quando data ainda não passou', () => {
    // 31 de dezembro sempre está no futuro até chegar o dia
    const now = new Date();
    const result = computeScheduledAt(12, 31, TZ);
    // Se ainda não chegou 31/dez deste ano, deve retornar este ano
    const thisYearDec31 = new Date(Date.UTC(now.getFullYear(), 11, 31, 9, 0, 0));
    if (thisYearDec31 > now) {
      expect(result.getFullYear()).toBe(now.getFullYear());
    }
  });

  it('hora padrão é 6h local (= 9h UTC em America/Sao_Paulo)', () => {
    const result = computeScheduledAt(12, 31, TZ);
    expect(result.getUTCHours()).toBe(9);
  });

  it('aceita hour=0 (meia-noite) sem erro', () => {
    const result = computeScheduledAt(12, 31, TZ, 0);
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
    // meia-noite SP (UTC-3) = 3h UTC
    expect(result.getUTCHours()).toBe(3);
  });

  it('aceita hour personalizado', () => {
    const result = computeScheduledAt(12, 31, TZ, 10);
    // 10h SP = 13h UTC
    expect(result.getUTCHours()).toBe(13);
  });
});
