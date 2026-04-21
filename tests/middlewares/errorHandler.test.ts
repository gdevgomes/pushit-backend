import { vi, describe, it, expect } from 'vitest';
import errorHandler, { isKnexError } from '../../src/middlewares/errorHandler';
import { AppError, Errors } from '../../src/errors';
import { Request, Response, NextFunction } from 'express';

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

const req = {} as Request;
const next = vi.fn() as unknown as NextFunction;

describe('isKnexError', () => {
  it('retorna false para null', () => expect(isKnexError(null)).toBe(false));
  it('retorna false para string', () => expect(isKnexError('err')).toBe(false));
  it('retorna false para objeto sem code', () => expect(isKnexError(new Error('x'))).toBe(false));
  it('retorna true para objeto com message e code', () => {
    const e = Object.assign(new Error('db'), { code: 'SQLITE_CONSTRAINT' });
    expect(isKnexError(e)).toBe(true);
  });
});

describe('errorHandler', () => {
  it('trata AppError sem detail', () => {
    const res = mockRes();
    errorHandler(new AppError(Errors.GROUP_NOT_FOUND), req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(404);
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty('detail');
  });

  it('inclui detail quando AppError tem detail', () => {
    const res = mockRes();
    errorHandler(new AppError(Errors.GROUP_NOT_FOUND, 'info extra'), req, res, next);
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ detail: 'info extra' });
  });

  it('trata KnexError → 400 DATABASE_ERROR', () => {
    const res = mockRes();
    const e = Object.assign(new Error('UNIQUE constraint failed'), { code: 'SQLITE_CONSTRAINT' });
    errorHandler(e as Error, req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(400);
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ key: 'DATABASE_ERROR' });
  });

  it('trata erro genérico → 500 INTERNAL_ERROR', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(500);
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ key: 'INTERNAL_ERROR' });
  });
});
