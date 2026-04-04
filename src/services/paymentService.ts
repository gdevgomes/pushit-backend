import crypto from 'node:crypto';
import groupRepository from '../repositories/groupRepository';
import subscriptionRepository from '../repositories/subscriptionRepository';
import paymentRepository from '../repositories/paymentRepository';
import { findUserById } from '../repositories/userRepository';
import { createPixQrCode } from '../utils/abacatePayClient';
import { AppError, Errors } from '../errors';
import { Payment } from '../types/payment';
import { Group } from '../types/group';

// PIX QR code expires in 24 hours
const PIX_EXPIRES_IN_SECONDS = 86400;

const createPixPayment = async (groupId: number, user: any): Promise<Payment> => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.ONLY_OWNER_CAN_PAY);

  const subscription = await subscriptionRepository.getByGroupId(groupId);
  if (!subscription) throw new AppError(Errors.SUBSCRIPTION_NOT_FOUND);
  if (subscription.status === 'cancelled') throw new AppError(Errors.SUBSCRIPTION_CANCELLED);

  // Return existing pending payment if still valid
  const existing = await paymentRepository.findPendingByGroupId(groupId);
  if (existing) return existing;

  const fullUser = await findUserById(user.id);
  if (!fullUser) throw new AppError(Errors.USER_NOT_FOUND);

  const amountInCents = Math.round(Number(subscription.monthly_amount) * 100);

  const qrCode = await createPixQrCode({
    amount: amountInCents,
    expiresIn: PIX_EXPIRES_IN_SECONDS,
    description: `Assinatura grupo ${group.name}`.slice(0, 37),
  });

  const payment = await paymentRepository.create({
    group_id: groupId,
    subscription_id: subscription.id,
    external_id: qrCode.id,
    amount: subscription.monthly_amount,
    status: 'pending',
    pix_br_code: qrCode.brCode,
    pix_br_code_base64: qrCode.brCodeBase64,
    expires_at: qrCode.expiresAt,
  });

  return payment;
};

const getGroupPayments = async (groupId: number, user: any, page: number, limit: number) => {
  const groups = await groupRepository.getGroupsByUser(user.id);
  const group = groups.find((g: Group) => g.id === groupId);
  if (!group) throw new AppError(Errors.GROUP_NOT_FOUND);
  if (group.owner_id !== user.id) throw new AppError(Errors.ONLY_OWNER_CAN_VIEW_PAYMENTS);

  return paymentRepository.getPaginatedByGroupId(groupId, page, limit);
};

const handleWebhook = async (rawBody: string, signatureHeader: string): Promise<void> => {
  const webhookSecret = process.env.ABACATE_PAY_WEBHOOK_SECRET;

  if (webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('base64');
    const A = Buffer.from(expectedSignature);
    const B = Buffer.from(signatureHeader);
    const isValid = A.length === B.length && crypto.timingSafeEqual(A, B);
    if (!isValid) throw new AppError(Errors.WEBHOOK_INVALID_SIGNATURE);
  }

  const payload = JSON.parse(rawBody);
  const { event, data } = payload;

  // transparent.completed is the event for PIX QR code payments
  if (event !== 'transparent.completed') return;

  const externalId: string = data.id ?? data.externalId;
  if (!externalId) return;

  const payment = await paymentRepository.findByExternalId(externalId);
  if (!payment || payment.status === 'paid') return;

  const paidAt = new Date();
  await paymentRepository.updateStatus(payment.id, 'paid', paidAt);

  // Extend subscription by 30 days from today (or from current paid_until if in future)
  const subscription = await subscriptionRepository.getByGroupId(payment.group_id);
  if (!subscription) return;

  const paidUntilSource = (subscription as any).paid_until;
  const base = paidUntilSource && new Date(paidUntilSource) > paidAt
    ? new Date(paidUntilSource)
    : paidAt;

  const paidUntil = new Date(base);
  paidUntil.setDate(paidUntil.getDate() + 30);

  await subscriptionRepository.updateStatus(payment.group_id, 'active');
  await subscriptionRepository.updatePaidUntil(payment.group_id, paidUntil);
};

export default { createPixPayment, getGroupPayments, handleWebhook };
