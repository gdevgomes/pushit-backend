import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/paymentService';
import { Pagination } from '../schemas';

export const createPixPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.createPixPayment(Number(req.params.groupId), req.user!);
    res.status(201).json({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      pixBrCode: payment.pix_br_code,
      pixQrCodeBase64: payment.pix_br_code_base64,
      expiresAt: payment.expires_at,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.validatedQuery as unknown as Pagination;
    const { data, total } = await paymentService.getGroupPayments(
      Number(req.params.groupId),
      req.user!,
      page,
      limit
    );
    res.status(200).json({ payments: data, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody: string = req.rawBody ?? JSON.stringify(req.body);
    const signature = (req.headers['x-webhook-signature'] as string) ?? '';
    await paymentService.handleWebhook(rawBody, signature);
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};
